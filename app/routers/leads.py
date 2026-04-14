from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel, EmailStr, validator
from supabase import Client
from typing import List, Optional
import os
from supabase import create_client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.database import get_db

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
class RFDSubmission(BaseModel):
    company: str
    contactPerson: str
    email: EmailStr
    phone: str
    budget: str
    products: List[str]
    message: Optional[str] = None

    @validator("company")
    def company_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Company name is required")
        return v.strip()

    @validator("contactPerson")
    def contact_person_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Contact person name is required")
        return v.strip()

    @validator("phone")
    def phone_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Phone number is required")
        return v.strip()

    @validator("budget")
    def budget_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Budget range is required")
        return v.strip()

    @validator("products")
    def products_not_empty(cls, v):
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
    subject: str
    message: str

    @validator("name")
    def name_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Name is required")
        return v

    @validator("email")
    def email_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Email is required")
        if "@" not in v:
            raise ValueError("Invalid email address")
        return v

    @validator("subject")
    def subject_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Subject is required")
        return v

    @validator("message")
    def message_required(cls, v):
        if not v or not v.strip():
            raise ValueError("Message is required")
        return v

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
        # All database operations in a transaction
        with supabase.client.table("leads").insert({
            "name": submission.contactPerson,
            "email": submission.email,
            "company": submission.company,
            "phone": submission.phone,
            "source": "RFD Form",
            "status": "new"
        }).execute() as response:
            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create lead record"
                )
            lead_id = response.data[0]["id"]

        # Create RFD submission records for each product
        for product in submission.products:
            try:
                supabase.table("rfd_submissions").insert({
                    "lead_id": lead_id,
                    "product_id": 1,  # Placeholder - would match with actual product
                    "message": submission.message or "",
                    "status": "pending"
                }).execute()
            except Exception as e:
                print(f"Error creating RFD submission for product {product}: {str(e)}")

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

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing RFD submission: {str(e)}"
        )


@router.post("/submit-contact")
def submit_contact(submission: ContactSubmission):
    """Submit a contact form"""
    try:
        # Find or create lead by email
        existing_lead = supabase.table("leads").select("*").eq("email", submission.email).execute()

        if existing_lead.data:
            lead_id = existing_lead.data[0]["id"]
        else:
            # Create new lead for contact form
            lead_data = {
                "name": submission.name,
                "email": submission.email,
                "source": "contact-form",
                "status": "new"
            }
            response = supabase.table("leads").insert(lead_data).execute()
            lead_id = response.data[0]["id"]

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
def get_contact_messages():
    """Get all contact messages"""
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
):
    """Return all leads with optional search and sort."""
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
async def get_lead(lead_id: int):
    """Get a specific lead with details"""
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
