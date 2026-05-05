from fastapi import APIRouter, HTTPException, Depends, Query, status, BackgroundTasks
from pydantic import BaseModel, EmailStr, field_validator
from supabase import Client
from typing import List, Optional
import os
from supabase import create_client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import html

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


def send_admin_rfd_alert(
    company: str,
    contact_person: str,
    contact_email: str,
    phone: str,
    products: List[str],
    lead_id: int,
) -> None:
    """
    Send notification email to all administrators about a new RFD submission.
    Failures are logged and swallowed -- must NEVER raise.
    """
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Warning: SMTP credentials not configured, skipping admin RFD alert")
            return

        # Fetch all admin emails
        admins_res = supabase.table("admin_users").select("email").execute()
        admin_emails = [
            row["email"] for row in (admins_res.data or [])
            if row.get("email")
        ]
        if not admin_emails:
            print("No admin recipients found for RFD alert; skipping")
            return

        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        products_str = ", ".join(products) if products else "(none)"
        subject = f"[New RFD] {company} - {contact_person}"

        text = f"""
A new Request-for-Demo has been submitted on the Nexus IT portal.

Company:        {company}
Contact Person: {contact_person}
Email:          {contact_email}
Phone:          {phone}
Products:       {products_str}
Lead ID:        {lead_id}
Submitted:      {timestamp}

Log in to the admin portal to review and follow up.
        """.strip()

        html = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>New RFD Submission</h2>
    <p>A new Request-for-Demo has been submitted on the Nexus IT portal.</p>
    <table cellpadding="6" style="border-collapse: collapse;">
      <tr><td><strong>Company</strong></td><td>{company}</td></tr>
      <tr><td><strong>Contact Person</strong></td><td>{contact_person}</td></tr>
      <tr><td><strong>Email</strong></td><td>{contact_email}</td></tr>
      <tr><td><strong>Phone</strong></td><td>{phone}</td></tr>
      <tr><td><strong>Products</strong></td><td>{products_str}</td></tr>
      <tr><td><strong>Lead ID</strong></td><td>{lead_id}</td></tr>
      <tr><td><strong>Submitted</strong></td><td>{timestamp}</td></tr>
    </table>
    <p>Log in to the admin portal to review and follow up.</p>
  </body>
</html>
        """.strip()

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL or SMTP_USERNAME
        # Put admins in Bcc (single send) so individual recipients aren't disclosed to each other
        # and we only pay one SMTP round-trip regardless of admin count.
        msg["To"] = FROM_EMAIL or SMTP_USERNAME
        msg["Bcc"] = ", ".join(admin_emails)
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, admin_emails, msg.as_string())
        server.quit()

        print(f"Admin RFD alert sent to {len(admin_emails)} admin(s) for lead {lead_id}")
    except Exception as e:
        print(f"Error sending admin RFD alert (lead {lead_id}): {str(e)}")


def send_visitor_rfd_confirmation(
    visitor_name: str,
    visitor_email: str,
    company: str,
    products: List[str],
) -> None:
    """
    Send confirmation email to visitor after RFD submission.
    Failures are logged and swallowed -- must NEVER raise.
    """
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Warning: SMTP credentials not configured, skipping visitor RFD confirmation")
            return

        # HTML-escape all user-provided values to prevent HTML injection
        visitor_name_escaped = html.escape(visitor_name)
        company_escaped = html.escape(company)
        products_escaped = [html.escape(p) for p in products]
        products_str_escaped = ", ".join(products_escaped) if products_escaped else "General inquiry"

        timestamp = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        products_str = ", ".join(products) if products else "General inquiry"
        subject = "Thank You for Your Demo Request - Nexus IT"

        text = f"""
Dear {visitor_name},

Thank you for your interest in Nexus IT solutions!

We have received your request for a product demonstration for {company}. Our team will review your inquiry and contact you shortly to schedule a personalized demo.

Products you're interested in:
{products_str}

What happens next?
• Our sales team will review your request within 1 business day
• We'll reach out to you via email or phone to schedule a convenient time for your demo
• You'll receive a calendar invite with demo details

If you have any immediate questions, feel free to reply to this email.

Best regards,
The Nexus IT Team

---
This confirmation was sent on {timestamp}
        """.strip()

        html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #2563eb; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Nexus IT</h1>
    </div>

    <div style="padding: 30px; background-color: #f9fafb;">
      <h2 style="color: #1f2937;">Thank You for Your Demo Request!</h2>

      <p>Dear {visitor_name_escaped},</p>

      <p>Thank you for your interest in Nexus IT solutions! We have received your request for a product demonstration for <strong>{company_escaped}</strong>.</p>

      <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2563eb; margin-top: 0;">Products you're interested in:</h3>
        <p style="color: #4b5563;">{products_str_escaped}</p>
      </div>

      <h3 style="color: #1f2937;">What happens next?</h3>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li>Our sales team will review your request within 1 business day</li>
        <li>We'll reach out to you via email or phone to schedule a convenient time for your demo</li>
        <li>You'll receive a calendar invite with demo details</li>
      </ul>

      <p>If you have any immediate questions, feel free to reply to this email.</p>

      <p style="margin-top: 30px;">Best regards,<br><strong>The Nexus IT Team</strong></p>
    </div>

    <div style="background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
      This confirmation was sent on {timestamp}
    </div>
  </body>
</html>
        """.strip()

        envelope_sender = FROM_EMAIL or SMTP_USERNAME
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = envelope_sender
        msg["To"] = visitor_email
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(envelope_sender, [visitor_email], msg.as_string())
        server.quit()

        print(f"RFD confirmation sent to visitor: {visitor_email}")
    except Exception as e:
        print(f"Error sending visitor RFD confirmation to {visitor_email}: {str(e)}")


def send_visitor_contact_confirmation(
    visitor_name: str,
    visitor_email: str,
    subject_line: str,
) -> None:
    """
    Send confirmation email to visitor after Contact Us submission.
    Failures are logged and swallowed -- must NEVER raise.
    """
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            print("Warning: SMTP credentials not configured, skipping visitor contact confirmation")
            return

        # HTML-escape all user-provided values to prevent HTML injection
        visitor_name_escaped = html.escape(visitor_name)
        subject_line_escaped = html.escape(subject_line)

        timestamp = datetime.utcnow().strftime("%B %d, %Y at %H:%M UTC")
        subject = "We've Received Your Message - Nexus IT"

        text = f"""
Dear {visitor_name},

Thank you for reaching out to Nexus IT!

We have received your message regarding: "{subject_line}"

Our team will review your inquiry and respond within 1-2 business days. We appreciate your patience and look forward to assisting you.

If your matter is urgent, please don't hesitate to call us directly.

Best regards,
The Nexus IT Team

---
This confirmation was sent on {timestamp}
        """.strip()

        html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #2563eb; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Nexus IT</h1>
    </div>

    <div style="padding: 30px; background-color: #f9fafb;">
      <h2 style="color: #1f2937;">We've Received Your Message!</h2>

      <p>Dear {visitor_name_escaped},</p>

      <p>Thank you for reaching out to Nexus IT!</p>

      <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2563eb; margin-top: 0;">Your Inquiry:</h3>
        <p style="color: #4b5563;">"{subject_line_escaped}"</p>
      </div>

      <p>Our team will review your inquiry and respond within <strong>1-2 business days</strong>. We appreciate your patience and look forward to assisting you.</p>

      <p>If your matter is urgent, please don't hesitate to call us directly.</p>

      <p style="margin-top: 30px;">Best regards,<br><strong>The Nexus IT Team</strong></p>
    </div>

    <div style="background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
      This confirmation was sent on {timestamp}
    </div>
  </body>
</html>
        """.strip()

        envelope_sender = FROM_EMAIL or SMTP_USERNAME
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = envelope_sender
        msg["To"] = visitor_email
        msg.attach(MIMEText(text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(envelope_sender, [visitor_email], msg.as_string())
        server.quit()

        print(f"Contact confirmation sent to visitor: {visitor_email}")
    except Exception as e:
        print(f"Error sending visitor contact confirmation to {visitor_email}: {str(e)}")


@router.post("/submit-rfd", response_model=SubmissionResponse)
async def submit_rfd(submission: RFDSubmission, background_tasks: BackgroundTasks):
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
            except Exception as e:
                print(f"Error linking anonymous activity: {str(e)}")

        # Create engagement log
        try:
            supabase.table("engagement_logs").insert({
                "lead_id": lead_id,
                "action": "RFD Submission",
                "details": f"Products: {', '.join(submission.products)}, Budget: {submission.budget}"
            }).execute()
        except Exception as e:
            print(f"Error creating engagement log: {str(e)}")

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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing RFD submission: {str(e)}"
        )


@router.post("/submit-contact")
def submit_contact(submission: ContactSubmission, background_tasks: BackgroundTasks):
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
            except Exception as e:
                print(f"Error linking anonymous activity: {str(e)}")

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
    try:
        status_history_res = db.table("lead_status_audit").select(
            "id, old_status, new_status, created_at, admin_users(name)"
        ).eq("lead_id", lead_id).order("created_at", desc=True).execute()
    except Exception as e:
        # Handle case where table doesn't exist yet or isn't in schema cache
        print(f"Warning: Could not fetch lead_status_audit: {e}")
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
    db.table("rfd_submissions").update({
        "status": new_status
    }).eq("lead_id", lead_id).execute()

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
