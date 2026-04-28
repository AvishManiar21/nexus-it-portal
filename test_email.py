"""
Test script to verify SMTP email configuration
Run this after configuring your SMTP credentials in .env
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# Load SMTP configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)

print("=" * 60)
print("SMTP Configuration Test")
print("=" * 60)
print(f"SMTP Server: {SMTP_SERVER}")
print(f"SMTP Port: {SMTP_PORT}")
print(f"SMTP Username: {SMTP_USERNAME}")
print(f"From Email: {FROM_EMAIL}")
print(f"Password configured: {'Yes' if SMTP_PASSWORD else 'No'}")
print("=" * 60)

if not SMTP_USERNAME or not SMTP_PASSWORD:
    print("\n❌ ERROR: SMTP credentials not configured!")
    print("\nPlease update your .env file with:")
    print("  SMTP_USERNAME=your_email@gmail.com")
    print("  SMTP_PASSWORD=your_app_password")
    print("\nFor Gmail, you need to generate an App Password:")
    print("  1. Go to https://myaccount.google.com/security")
    print("  2. Enable 2-Step Verification")
    print("  3. Go to https://myaccount.google.com/apppasswords")
    print("  4. Generate an App Password for 'Mail'\n")
    exit(1)

# Get recipient email
recipient = input("\nEnter recipient email address to test: ").strip()
if not recipient:
    print("❌ No recipient provided. Exiting.")
    exit(1)

print(f"\n📧 Sending test email to {recipient}...")

try:
    # Create test email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Test Email - Nexus IT SMTP Configuration"
    msg["From"] = FROM_EMAIL
    msg["To"] = recipient

    text = f"""
Test Email from Nexus IT

This is a test email to verify your SMTP configuration is working correctly.

If you received this email, your SMTP settings are configured properly!

SMTP Server: {SMTP_SERVER}
SMTP Port: {SMTP_PORT}
From: {FROM_EMAIL}
    """.strip()

    html = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #2563eb; padding: 20px; text-align: center;">
      <h1 style="color: white; margin: 0;">Nexus IT</h1>
    </div>

    <div style="padding: 30px; background-color: #f9fafb;">
      <h2 style="color: #1f2937;">Test Email - SMTP Configuration</h2>

      <p>This is a test email to verify your SMTP configuration is working correctly.</p>

      <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #065f46; font-weight: bold;">✅ Success!</p>
        <p style="margin: 5px 0 0 0; color: #065f46;">If you received this email, your SMTP settings are configured properly!</p>
      </div>

      <h3 style="color: #1f2937;">Configuration Details:</h3>
      <ul style="color: #4b5563; line-height: 1.8;">
        <li><strong>SMTP Server:</strong> {SMTP_SERVER}</li>
        <li><strong>SMTP Port:</strong> {SMTP_PORT}</li>
        <li><strong>From Email:</strong> {FROM_EMAIL}</li>
      </ul>
    </div>

    <div style="background-color: #e5e7eb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
      This is an automated test email from Nexus IT
    </div>
  </body>
</html>
    """.strip()

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    # Connect to SMTP server and send
    server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
    server.starttls()
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    server.sendmail(FROM_EMAIL, [recipient], msg.as_string())
    server.quit()

    print("\n✅ SUCCESS! Test email sent successfully!")
    print(f"   Check {recipient} inbox (and spam folder)")
    print("\n🎉 Your SMTP configuration is working correctly!")

except smtplib.SMTPAuthenticationError:
    print("\n❌ AUTHENTICATION FAILED!")
    print("   Your username or password is incorrect.")
    print("\n   For Gmail, make sure you're using an App Password:")
    print("   1. Go to https://myaccount.google.com/apppasswords")
    print("   2. Generate a new App Password for 'Mail'")
    print("   3. Update SMTP_PASSWORD in your .env file")

except smtplib.SMTPException as e:
    print(f"\n❌ SMTP ERROR: {str(e)}")
    print("   Check your SMTP server settings and try again.")

except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("   An unexpected error occurred.")
