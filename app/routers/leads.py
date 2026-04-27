from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, EmailStr, field_validator
from supabase import Client
from typing import List, Optional
import os
from supabase import create_client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.database import get_db
from app.dependencies.auth import get_current_admin

router = APIRouter(prefix="/leads", tags=["leads"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(supabase_url, supabase_key)

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SENDER_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("SENDER_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

SORTABLE_COLUMNS = {"name", "email", "company", "status", "created_at"}

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
        allowed_statuses = {"new", "contacted", "converted"}
        if v.lower() not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
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

def send_confirmation_email(email: str, contact_person: str, company: str) -> bool:
    """Send confirmation email to visitor"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Warning: SMTP credentials not configured, skipping email")
            return False

        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Demo Request Confirmation - Nexus IT"
        msg["From"] = SMTP_USERNAME
        msg["To"] = email

        # Create plain text and HTML versions
        text = f"""
Dear {contact_person},

Thank you for submitting your demo request for Nexus IT solutions!

We have received your request on behalf of {company} and will review your interest in our products.
A member of our sales team will be in touch with you shortly at {email} to discuss your specific needs and schedule a demo.

Best regards,
Nexus IT Sales Team
        """.strip()

        html = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>Demo Request Confirmation</h2>
    <p>Dear {contact_person},</p>
    <p>Thank you for submitting your demo request for Nexus IT solutions!</p>
    <p>We have received your request on behalf of <strong>{company}</strong> and will review your interest in our products.</p>
    <p>A member of our sales team will be in touch with you shortly to discuss your specific needs and schedule a demo.</p>
    <br/>
    <p>Best regards,<br/>
    <strong>Nexus IT Sales Team</strong></p>
  </body>
</html>
        """.strip()

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")
        msg.attach(part1)
        msg.attach(part2)

        # Send email
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, email, msg.as_string())
        server.quit()

        print(f"Confirmation email sent to {email}")
        return True
    except Exception as e:
        print(f"Error sending confirmation email: {str(e)}")
        return False

def send_contact_confirmation_email(to_email: str, name: str, subject: str) -> bool:
    """Send confirmation email to contact form submitter"""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Warning: SMTP credentials not configured, skipping email")
            return False

        msg = MIMEMultipart()
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        msg["Subject"] = "We received your message"

        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <p>Hi {name},</p>
                <p>Thank you for contacting us. We received your message regarding <strong>{subject}</strong>.</p>
                <p>Our team will review your message and get back to you soon.</p>
                <br>
                <p>Best regards,<br>
                Our Team</p>
            </body>
        </html>
        """

        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

@router.post("/submit-rfd", response_model=SubmissionResponse)
async def submit_rfd(submission: RFDSubmission):
    """
    Submit RFD with transactional integrity:
    1. Create lead record
    2. Create RFD submission records for each product
    3. Send confirmation email
    """
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

        # Create engagement log
        try:
            supabase.table("engagement_logs").insert({
                "lead_id": lead_id,
                "action": "RFD Submission",
                "details": f"Products: {', '.join(submission.products)}, Budget: {submission.budget}"
            }).execute()
        except Exception as e:
            print(f"Error creating engagement log: {str(e)}")

        # Send confirmation email (non-blocking)
        send_confirmation_email(submission.email, submission.contactPerson, submission.company)

        return SubmissionResponse(
            success=True,
            message=f"Thank you! Your demo request has been submitted successfully. A confirmation email has been sent to {submission.email}",
            lead_id=lead_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing RFD submission: {str(e)}"
        )


@router.post("/submit-contact")
def submit_contact(submission: ContactSubmission):
    """Submit a contact form"""
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

        # Send confirmation email
        send_contact_confirmation_email(submission.email, submission.name, submission.subject)

        return {
            "message": "Your message has been received. We will get back to you soon.",
            "lead_id": lead_id
        }
    except Exception as e:
        print(f"Error processing contact submission: {e}")
        raise Exception("Failed to process contact submission")


@router.get("/contact-messages")
def get_contact_messages(admin: dict = Depends(get_current_admin)):
    """Get all contact messages (requires authentication)"""
    try:
        response = supabase.table("contact_messages").select("*").execute()
        return response.data
    except Exception as e:
        print(f"Error fetching contact messages: {e}")
        return []


@router.get("/")
def get_leads(
    search: Optional[str] = Query(None, description="Search by company, contact name, or email"),
    sort_by: Optional[str] = Query("created_at", description="Column to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Client = Depends(get_db),
    admin: dict = Depends(get_current_admin),
):
    """Return all leads with optional search and sort (requires authentication)"""
    if sort_by not in SORTABLE_COLUMNS:
        sort_by = "created_at"
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"

    query = db.table("leads").select("id, name, email, company, status, created_at")

    if search and search.strip():
        term = search.strip()
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching lead: {str(e)}"
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
    status_history_res = db.table("lead_status_audit").select(
        "id, old_status, new_status, created_at, admin_users(name)"
    ).eq("lead_id", lead_id).order("created_at", desc=True).execute()

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
    old_status = current_lead["status"]
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
