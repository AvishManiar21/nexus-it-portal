"""
Transactional emails: admin RFD alerts and visitor confirmations.

Every public function here is meant to run as a FastAPI background task,
so failures are logged and swallowed -- they must NEVER raise.
"""
import html
import logging
import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

from app.database import get_db

logger = logging.getLogger(__name__)

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("SENDER_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("SENDER_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)


def _send(
    *,
    subject: str,
    to_header: str,
    recipients: List[str],
    envelope_sender: str,
    text: str,
    html_body: str,
    bcc: Optional[List[str]] = None,
) -> None:
    """Build a plain-text + HTML message and send it over STARTTLS."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL or SMTP_USERNAME
    msg["To"] = to_header
    if bcc:
        msg["Bcc"] = ", ".join(bcc)
    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(envelope_sender, recipients, msg.as_string())


def send_admin_rfd_alert(
    company: str,
    contact_person: str,
    contact_email: str,
    phone: str,
    products: List[str],
    lead_id: int,
) -> None:
    """Send notification email to all administrators about a new RFD submission."""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured, skipping admin RFD alert")
            return

        # Fetch all admin emails
        admins_res = get_db().table("admin_users").select("email").execute()
        admin_emails = [
            row["email"] for row in (admins_res.data or [])
            if row.get("email")
        ]
        if not admin_emails:
            logger.warning("No admin recipients found for RFD alert; skipping")
            return

        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        products_str = ", ".join(products) if products else "(none)"
        # Strip CR/LF so visitor input cannot inject extra email headers
        subject = f"[New RFD] {company} - {contact_person}".replace("\r", " ").replace("\n", " ")

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

        # HTML-escape all visitor-provided values so they render as text, not markup
        safe = {
            "company": html.escape(company),
            "contact_person": html.escape(contact_person),
            "contact_email": html.escape(contact_email),
            "phone": html.escape(phone),
            "products": html.escape(products_str),
        }
        html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <h2>New RFD Submission</h2>
    <p>A new Request-for-Demo has been submitted on the Nexus IT portal.</p>
    <table cellpadding="6" style="border-collapse: collapse;">
      <tr><td><strong>Company</strong></td><td>{safe["company"]}</td></tr>
      <tr><td><strong>Contact Person</strong></td><td>{safe["contact_person"]}</td></tr>
      <tr><td><strong>Email</strong></td><td>{safe["contact_email"]}</td></tr>
      <tr><td><strong>Phone</strong></td><td>{safe["phone"]}</td></tr>
      <tr><td><strong>Products</strong></td><td>{safe["products"]}</td></tr>
      <tr><td><strong>Lead ID</strong></td><td>{lead_id}</td></tr>
      <tr><td><strong>Submitted</strong></td><td>{timestamp}</td></tr>
    </table>
    <p>Log in to the admin portal to review and follow up.</p>
  </body>
</html>
        """.strip()

        # Admins go in Bcc (single send) so recipients aren't disclosed to each other
        # and we only pay one SMTP round-trip regardless of admin count.
        _send(
            subject=subject,
            to_header=FROM_EMAIL or SMTP_USERNAME,
            bcc=admin_emails,
            recipients=admin_emails,
            envelope_sender=SMTP_USERNAME,
            text=text,
            html_body=html_body,
        )
        logger.info("Admin RFD alert sent to %d admin(s) for lead %s", len(admin_emails), lead_id)
    except Exception:
        logger.exception("Error sending admin RFD alert (lead %s)", lead_id)


def send_visitor_rfd_confirmation(
    visitor_name: str,
    visitor_email: str,
    company: str,
    products: List[str],
) -> None:
    """Send confirmation email to visitor after RFD submission."""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured, skipping visitor RFD confirmation")
            return

        # HTML-escape all user-provided values to prevent HTML injection
        visitor_name_escaped = html.escape(visitor_name)
        company_escaped = html.escape(company)
        products_escaped = [html.escape(p) for p in products]
        products_str_escaped = ", ".join(products_escaped) if products_escaped else "General inquiry"

        timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
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

        _send(
            subject=subject,
            to_header=visitor_email,
            recipients=[visitor_email],
            envelope_sender=FROM_EMAIL or SMTP_USERNAME,
            text=text,
            html_body=html_body,
        )
        logger.info("RFD confirmation sent to visitor: %s", visitor_email)
    except Exception:
        logger.exception("Error sending visitor RFD confirmation to %s", visitor_email)


def send_visitor_contact_confirmation(
    visitor_name: str,
    visitor_email: str,
    subject_line: str,
) -> None:
    """Send confirmation email to visitor after Contact Us submission."""
    try:
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            logger.warning("SMTP credentials not configured, skipping visitor contact confirmation")
            return

        # HTML-escape all user-provided values to prevent HTML injection
        visitor_name_escaped = html.escape(visitor_name)
        subject_line_escaped = html.escape(subject_line)

        timestamp = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
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

        _send(
            subject=subject,
            to_header=visitor_email,
            recipients=[visitor_email],
            envelope_sender=FROM_EMAIL or SMTP_USERNAME,
            text=text,
            html_body=html_body,
        )
        logger.info("Contact confirmation sent to visitor: %s", visitor_email)
    except Exception:
        logger.exception("Error sending visitor contact confirmation to %s", visitor_email)
