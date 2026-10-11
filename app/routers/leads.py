import logging
from fastapi import APIRouter, HTTPException, Depends, Query, Request, status, BackgroundTasks
from pydantic import BaseModel, EmailStr, field_validator
from supabase import Client
from typing import List, Optional
import re

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.rate_limit import limiter, FORM_LIMIT
from app.services.email import (
    send_admin_rfd_alert,
    send_visitor_contact_confirmation,
    send_visitor_rfd_confirmation,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/leads", tags=["leads"])

# Shared service-role client (app/database.py requires SUPABASE_SERVICE_ROLE_KEY;
# the anon key cannot work here because RLS denies it everything)
supabase = get_db()

SORTABLE_COLUMNS = {"name", "email", "company", "status", "created_at"}
ALLOWED_LEAD_STATUSES = ("new", "contacted", "converted")

# Pydantic models
class LeadNote(BaseModel):
    note: str

    @field_validator("note")
    @classmethod
    def note_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Note cannot be empty")
        return v.strip()

class LeadStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v.lower() not in ALLOWED_LEAD_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(ALLOWED_LEAD_STATUSES)}")
        return v.lower()

class RFDSubmission(BaseModel):
    company: str
    contactPerson: str
    email: EmailStr
    phone: str
    budget: str
    products: List[str]
    message: Optional[str] = None
    session_id: Optional[str] = None
    # Honeypot: hidden in the form, so only bots fill it in
    website: Optional[str] = None

    @field_validator("company")
    @classmethod
    def company_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Company name is required")
        return v

    @field_validator("contactPerson")
    @classmethod
    def contact_person_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Contact person name is required")
        return v

    @field_validator("phone")
    @classmethod
    def phone_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone number is required")
        return v

    @field_validator("budget")
    @classmethod
    def budget_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Budget range is required")
        return v

    @field_validator("products")
    @classmethod
    def products_not_empty(cls, v: List[str]) -> List[str]:
        if not v or len(v) == 0:
            raise ValueError("Please select at least one product")
        return v

class LeadResponse(BaseModel):
    id: int
    name: str
    email: str
    company: str
    phone: str
    source: str
    status: str
    created_at: str

class SubmissionResponse(BaseModel):
    success: bool
    message: str
    lead_id: Optional[int] = None

class ContactSubmission(BaseModel):
    name: str
    email: str
    company: str
    phone: str
    budget: str
    subject: str
    message: str
    session_id: Optional[str] = None
    # Honeypot: hidden in the form, so only bots fill it in
    website: Optional[str] = None

    @field_validator("name")
    @classmethod
    def name_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v

    @field_validator("email")
    @classmethod
    def email_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Email is required")
        if "@" not in v:
            raise ValueError("Invalid email address")
        return v

    @field_validator("subject")
    @classmethod
    def subject_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Subject is required")
        return v

    @field_validator("company")
    @classmethod
    def company_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Company name is required")
        return v

    @field_validator("phone")
    @classmethod
    def phone_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Phone is required")
        return v

    @field_validator("budget")
    @classmethod
    def budget_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Budget range is required")
        return v

    @field_validator("message")
    @classmethod
    def message_required(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Message is required")
        return v

def upsert_lead_from_submission(lead_data: dict):
    """
    Concurrency-safe lead creation/update using email unique constraint.
    Returns the resulting lead row with id and profile fields.
    """
    response = supabase.table("leads").upsert(
        lead_data,
        on_conflict="email",
    ).execute()

    if response.data:
        return response.data[0]

    # Fallback when upsert does not return representation.
    lookup = supabase.table("leads").select("*").eq("email", lead_data["email"]).limit(1).execute()
    if not lookup.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or retrieve lead record"
        )
    return lookup.data[0]

def resolve_product_ids(product_names: List[str]) -> dict:
    """Map product names from form payload to product IDs from DB."""
    products_res = supabase.table("products").select("id,name").execute()
    name_to_id = {p["name"]: p["id"] for p in (products_res.data or [])}
    resolved = {}
    for name in product_names:
        product_id = name_to_id.get(name)
        if not product_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown product selected: {name}"
            )
        resolved[name] = product_id
    return resolved


@router.post("/submit-rfd", response_model=SubmissionResponse)
@limiter.limit(FORM_LIMIT)
async def submit_rfd(request: Request, submission: RFDSubmission, background_tasks: BackgroundTasks):
    """
    Submit RFD with transactional integrity:
    1. Create lead record
    2. Create RFD submission records for each product
    3. Send confirmation email
    """
    if submission.website:
        # Honeypot tripped: pretend success so the bot learns nothing, but store/send nothing
        return SubmissionResponse(success=True, message="Thank you! Your demo request has been submitted successfully.")

    try:
        lead_data = {
            "name": submission.contactPerson,
            "email": submission.email,
            "company": submission.company,
            "phone": submission.phone,
            "source": "RFD Form",
            "status": "new",
            "budget": submission.budget,
        }
        if submission.session_id:
            lead_data["session_id"] = submission.session_id
        lead = upsert_lead_from_submission(lead_data)
        lead_id = lead["id"]

        # Create RFD submission records for each selected product.
        # If any product cannot be resolved or persisted, fail the request to avoid silent data loss.
        product_map = resolve_product_ids(submission.products)
        for product_name in submission.products:
            supabase.table("rfd_submissions").insert({
                "lead_id": lead_id,
                "product_id": product_map[product_name],
                "message": submission.message or "",
                "status": "pending"
            }).execute()

        # Link all prior anonymous activity to this lead (UC-08: Anonymous-to-Lead Linking)
        if submission.session_id:
            try:
                # Link page views
                supabase.table("visitor_page_views").update({
                    "lead_id": lead_id
                }).eq("session_id", submission.session_id).is_("lead_id", "null").execute()

                # Link video engagement events
                supabase.table("video_engagement_events").update({
                    "lead_id": lead_id
                }).eq("session_id", submission.session_id).is_("lead_id", "null").execute()
            except Exception:
                logger.exception("Error linking anonymous activity to lead %s", lead_id)

        # Create engagement log
        try:
            supabase.table("engagement_logs").insert({
                "lead_id": lead_id,
                "action": "RFD Submission",
                "details": f"Products: {', '.join(submission.products)}, Budget: {submission.budget}"
            }).execute()
        except Exception:
            logger.exception("Error creating engagement log for lead %s", lead_id)

        # Schedule visitor confirmation email as a background task (non-blocking)
        background_tasks.add_task(
            send_visitor_rfd_confirmation,
            visitor_name=submission.contactPerson,
            visitor_email=submission.email,
            company=submission.company,
            products=submission.products,
        )

        # Schedule admin alert as a background task so the response is not delayed.
        # Failures inside the helper are swallowed, so the visitor's submission is unaffected.
        background_tasks.add_task(
            send_admin_rfd_alert,
            company=submission.company,
            contact_person=submission.contactPerson,
            contact_email=submission.email,
            phone=submission.phone,
            products=submission.products,
            lead_id=lead_id,
        )

        return SubmissionResponse(
            success=True,
            message=f"Thank you! Your demo request has been submitted successfully. A confirmation email has been sent to {submission.email}",
            lead_id=lead_id
        )

    except HTTPException:
        raise
    except Exception:
        logger.exception("Error processing RFD submission")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing RFD submission"
        )


@router.post("/submit-contact")
@limiter.limit(FORM_LIMIT)
def submit_contact(request: Request, submission: ContactSubmission, background_tasks: BackgroundTasks):
    """Submit a contact form"""
    if submission.website:
        # Honeypot tripped: pretend success so the bot learns nothing, but store/send nothing
        return {"message": "Your message has been received. We will get back to you soon."}

    try:
        # Upsert provides concurrency-safe create/update under simultaneous submissions.
        lead_data = {
            "name": submission.name,
            "email": submission.email,
            "company": submission.company,
            "phone": submission.phone,
            "budget": submission.budget,
            "source": "contact-form",
            "status": "new",
        }
        if submission.session_id:
            lead_data["session_id"] = submission.session_id
        lead = upsert_lead_from_submission(lead_data)
        lead_id = lead["id"]

        # Store contact message
        message_data = {
            "lead_id": lead_id,
            "name": submission.name,
            "email": submission.email,
            "subject": submission.subject,
            "message": submission.message,
            "status": "new"
        }
        supabase.table("contact_messages").insert(message_data).execute()

        # Link all prior anonymous activity to this lead (UC-08: Anonymous-to-Lead Linking)
        if submission.session_id:
            try:
                # Link page views
                supabase.table("visitor_page_views").update({
                    "lead_id": lead_id
                }).eq("session_id", submission.session_id).is_("lead_id", "null").execute()

                # Link video engagement events
                supabase.table("video_engagement_events").update({
                    "lead_id": lead_id
                }).eq("session_id", submission.session_id).is_("lead_id", "null").execute()
            except Exception:
                logger.exception("Error linking anonymous activity to lead %s", lead_id)

        # Schedule visitor confirmation email as a background task (non-blocking)
        background_tasks.add_task(
            send_visitor_contact_confirmation,
            visitor_name=submission.name,
            visitor_email=submission.email,
            subject_line=submission.subject,
        )

        return {
            "message": "Your message has been received. We will get back to you soon.",
            "lead_id": lead_id
        }
    except Exception:
        logger.exception("Error processing contact submission")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process contact submission"
        )


@router.get("/contact-messages")
def get_contact_messages(admin: dict = Depends(get_current_admin)):
    """Get all contact messages (requires authentication)"""
    try:
        response = supabase.table("contact_messages").select("*").execute()
        return response.data
    except Exception:
        logger.exception("Error fetching contact messages")
        return []


@router.get("/")
def get_leads(
    search: Optional[str] = Query(None, description="Search by company, contact name, or email"),
    status_filter: Optional[str] = Query(None, description="Filter by status: new, contacted, converted, or all"),
    sort_by: Optional[str] = Query("created_at", description="Column to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Return all leads with optional search, status filter, and sort (requires authentication)"""
    if sort_by not in SORTABLE_COLUMNS:
        sort_by = "created_at"
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"

    query = db.table("leads").select("id, name, email, company, phone, status, source, created_at")

    # Apply status filter if provided and not "all"
    if status_filter:
        normalized_filter = status_filter.lower().strip()
        if normalized_filter != "all":
            if normalized_filter not in ALLOWED_LEAD_STATUSES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid status_filter. Must be one of: {', '.join(ALLOWED_LEAD_STATUSES)}, or 'all'"
                )
            query = query.eq("status", normalized_filter)

    # Commas, parentheses, quotes and backslashes are PostgREST filter syntax;
    # left in, they let the search text add or alter conditions in or_().
    term = re.sub(r'[,()"\\]', " ", search or "").strip()
    if term:
        query = query.or_(
            f"company.ilike.%{term}%,name.ilike.%{term}%,email.ilike.%{term}%"
        )

    descending = sort_order == "desc"
    query = query.order(sort_by, desc=descending)

    result = query.execute()
    return result.data


@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(lead_id: int, admin: dict = Depends(get_current_admin)):
    """Get a specific lead with details (requires authentication)"""
    try:
        response = supabase.table("leads").select("*").eq("id", lead_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead not found"
            )
        return response.data[0]
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching lead %s", lead_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching lead"
        )


@router.get("/{lead_id}/profile")
async def get_lead_profile(lead_id: int, db: Client = Depends(get_db), admin: dict = Depends(get_current_admin)):
    """Return the full lead profile: contact info, form submissions, behavioral timeline, and notes."""
    # Lead contact details
    lead_res = db.table("leads").select("*").eq("id", lead_id).execute()
    if not lead_res.data:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead = lead_res.data[0]

    # RFD submissions with product name
    rfd_res = db.table("rfd_submissions").select(
        "id, message, status, created_at, product_id, products(name)"
    ).eq("lead_id", lead_id).order("created_at", desc=True).execute()

    # Contact messages
    contact_res = db.table("contact_messages").select(
        "id, subject, message, status, created_at"
    ).eq("lead_id", lead_id).order("created_at", desc=True).execute()

    # Engagement logs (general actions)
    engagement_res = db.table("engagement_logs").select(
        "id, action, details, created_at"
    ).eq("lead_id", lead_id).order("created_at", desc=True).execute()

    # Internal notes with admin author name
    notes_res = db.table("lead_notes").select(
        "id, note, created_at, admin_id, admin_users(name)"
    ).eq("lead_id", lead_id).order("created_at", desc=True).execute()

    # Status change history with admin attribution
    try:
        status_history_res = db.table("lead_status_audit").select(
            "id, old_status, new_status, created_at, admin_users(name)"
        ).eq("lead_id", lead_id).order("created_at", desc=True).execute()
    except Exception as e:
        # Handle case where table doesn't exist yet or isn't in schema cache
        logger.warning("Could not fetch lead_status_audit: %s", e)
        status_history_res = type('obj', (object,), {'data': []})()

    # Build a unified chronological timeline
    timeline = []

    # Engagement logs (e.g. RFD Submission)
    for e in (engagement_res.data or []):
        timeline.append({
            "type": e["action"],
            "details": e.get("details"),
            "occurred_at": e["created_at"],
        })

    # Behavioral data linked via session_id
    session_id = lead.get("session_id")
    if session_id:
        # Product page views
        page_views_res = db.table("visitor_page_views").select(
            "product_id, viewed_at, products(name)"
        ).eq("session_id", session_id).execute()
        for pv in (page_views_res.data or []):
            product_name = (pv.get("products") or {}).get("name", f"Product #{pv['product_id']}")
            timeline.append({
                "type": "Page View",
                "details": f"Viewed {product_name}",
                "occurred_at": pv["viewed_at"],
            })

        # Video engagement events (demo started, demo completed, with duration)
        video_res = db.table("video_engagement_events").select(
            "product_id, event_type, watch_duration_seconds, created_at, products(name)"
        ).eq("session_id", session_id).execute()
        for ve in (video_res.data or []):
            product_name = (ve.get("products") or {}).get("name", f"Product #{ve['product_id']}")
            event_label = ve["event_type"].replace("_", " ").title()
            detail = f"{event_label} — {product_name}"
            if ve.get("watch_duration_seconds"):
                detail += f" ({ve['watch_duration_seconds']}s watched)"
            timeline.append({
                "type": "Demo Video",
                "details": detail,
                "occurred_at": ve["created_at"],
            })

    # Sort timeline chronologically (oldest first)
    timeline.sort(key=lambda x: x["occurred_at"])

    return {
        "lead": lead,
        "rfd_submissions": rfd_res.data or [],
        "contact_messages": contact_res.data or [],
        "timeline": timeline,
        "notes": [
            {
                "id": n["id"],
                "note": n["note"],
                "created_at": n["created_at"],
                "author": (n.get("admin_users") or {}).get("name", "Unknown"),
            }
            for n in (notes_res.data or [])
        ],
        "status_history": [
            {
                "id": s["id"],
                "old_status": s["old_status"],
                "new_status": s["new_status"],
                "changed_by": (s.get("admin_users") or {}).get("name", "Unknown"),
                "created_at": s["created_at"],
            }
            for s in (status_history_res.data or [])
        ],
    }


@router.post("/{lead_id}/notes")
async def create_lead_note(
    lead_id: int,
    note_data: LeadNote,
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Create a new note on a lead profile (requires authentication)"""
    # Verify lead exists
    lead_res = db.table("leads").select("id").eq("id", lead_id).execute()
    if not lead_res.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    # Create note
    note_res = db.table("lead_notes").insert({
        "lead_id": lead_id,
        "admin_id": admin["id"],
        "note": note_data.note,
    }).execute()

    if not note_res.data:
        raise HTTPException(status_code=500, detail="Failed to create note")

    # Return created note with admin name
    note_with_admin = db.table("lead_notes").select(
        "id, note, created_at, admin_users(name)"
    ).eq("id", note_res.data[0]["id"]).execute()

    created_note = note_with_admin.data[0] if note_with_admin.data else note_res.data[0]

    return {
        "id": created_note["id"],
        "note": created_note["note"],
        "author": created_note.get("admin_users", {}).get("name", "Unknown") if isinstance(created_note.get("admin_users"), dict) else "Unknown",
        "created_at": created_note["created_at"],
    }


@router.patch("/{lead_id}/status")
async def update_lead_status(
    lead_id: int,
    status_update: LeadStatusUpdate,
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Update lead status and create audit log entry (requires authentication)"""
    # Get current lead status
    lead_res = db.table("leads").select("id, status").eq("id", lead_id).execute()
    if not lead_res.data:
        raise HTTPException(status_code=404, detail="Lead not found")

    current_lead = lead_res.data[0]
    # Normalize NULL status to "new" for audit trail consistency
    old_status = current_lead["status"] or "new"
    new_status = status_update.status

    # Don't create audit log if status hasn't changed
    if old_status == new_status:
        return {
            "id": lead_id,
            "status": new_status,
            "message": "Status unchanged"
        }

    # Update lead status
    update_res = db.table("leads").update({
        "status": new_status
    }).eq("id", lead_id).execute()

    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to update status")

    # Also update rfd_submissions status for this lead (if any exist)
    # This keeps the RFD form status in sync with the lead status
    try:
        db.table("rfd_submissions").update({
            "status": new_status
        }).eq("lead_id", lead_id).execute()
    except Exception as e:
        # Log the error but don't fail the entire request
        # Some leads may not have RFD submissions
        logger.warning("Could not update rfd_submissions status for lead %s: %s", lead_id, e)

    # Create audit log entry
    audit_res = db.table("lead_status_audit").insert({
        "lead_id": lead_id,
        "admin_id": admin["id"],
        "old_status": old_status,
        "new_status": new_status,
    }).execute()

    if not audit_res.data:
        raise HTTPException(status_code=500, detail="Failed to create audit log")

    return {
        "id": lead_id,
        "status": new_status,
        "old_status": old_status,
        "message": "Status updated successfully"
    }
