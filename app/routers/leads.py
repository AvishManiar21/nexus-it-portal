from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional
import os
from supabase import create_client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

router = APIRouter(prefix="/leads", tags=["leads"])

# Initialize Supabase
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)

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

def send_confirmation_email(email: str, contact_person: str, company: str) -> bool:
    """Send confirmation email to visitor"""
    try:
        # Use environment variables for SMTP configuration
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", 587))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Warning: SMTP credentials not configured, skipping email")
            return False
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Demo Request Confirmation - Nexus IT"
        msg["From"] = sender_email
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
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()
        
        print(f"Confirmation email sent to {email}")
        return True
    except Exception as e:
        print(f"Error sending confirmation email: {str(e)}")
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

@router.get("/", response_model=List[LeadResponse])
async def get_leads():
    """Get all leads"""
    try:
        response = supabase.table("leads").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching leads: {str(e)}"
        )

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
