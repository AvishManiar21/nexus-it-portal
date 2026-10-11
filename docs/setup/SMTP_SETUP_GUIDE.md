# SMTP Email Setup Guide

This guide will help you configure email sending for visitor confirmation emails in the Nexus IT application.

## Overview

The application sends confirmation emails to visitors when they:
- Submit a Request for Demo (RFD) form
- Submit a Contact Us form

## Prerequisites

- A Gmail account (or other SMTP email provider)
- Python environment with dependencies installed

## Step 1: Generate Gmail App Password

For Gmail accounts (recommended):

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to https://myaccount.google.com/security
   - Click on "2-Step Verification"
   - Follow the prompts to enable it

2. **Generate an App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select your device type
   - Click "Generate"
   - **Copy the 16-character password** (you won't be able to see it again)

> **Important**: Use the App Password, NOT your regular Gmail password!

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` if you haven't already, then edit your `.env` file in the project root directory:

```bash
cp .env.example .env
```

Update the SMTP configuration in `.env`:

```env
# SMTP Configuration for Gmail
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password_here
FROM_EMAIL=your_email@gmail.com
```

Replace:
- `your_email@gmail.com` with your actual Gmail address
- `your_16_char_app_password_here` with the App Password you generated

## Step 3: Test Your Configuration

Run the test script to verify your SMTP setup works:

```bash
python test_email.py
```

The script will:
1. Check if SMTP credentials are configured
2. Prompt you for a test recipient email
3. Send a test email
4. Report success or errors

**Expected Output** (on success):
```
✅ SUCCESS! Test email sent successfully!
   Check recipient@example.com inbox (and spam folder)

🎉 Your SMTP configuration is working correctly!
```

## Step 4: Restart Backend Server

After configuring SMTP, restart your backend server to load the new environment variables:

```bash
# Kill existing server (Ctrl+C)
# Then restart:
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Alternative Email Providers

### Using Outlook/Office 365

```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=your_email@outlook.com
SMTP_PASSWORD=your_outlook_password
FROM_EMAIL=your_email@outlook.com
```

### Using Custom SMTP Server

```env
SMTP_SERVER=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USERNAME=noreply@yourdomain.com
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com
```

## Troubleshooting

### "AUTHENTICATION FAILED" Error

- **For Gmail**: Make sure you're using an App Password, not your regular password
- **For Gmail**: Verify 2-Step Verification is enabled
- Double-check the username and password in `.env`

### "SMTPServerDisconnected" Error

- Check that SMTP_SERVER and SMTP_PORT are correct
- Verify your firewall isn't blocking port 587
- For Gmail, ensure "Less secure app access" is NOT required (App Passwords bypass this)

### Emails Going to Spam

- Add SPF/DKIM records to your domain (if using custom domain)
- Ask recipients to mark your emails as "Not Spam"
- Use a professional email address (avoid free Gmail for production)

### No Error But Email Not Received

- Check the spam/junk folder
- Verify the recipient email address is correct
- Check server logs for any warnings

## Email Templates

The application sends two types of confirmation emails:

### 1. RFD (Request for Demo) Confirmation

Sent when a visitor submits the Request for Demo form.

**Template Location**: `app/routers/leads.py` - `send_visitor_rfd_confirmation()`

**Includes**:
- Confirmation of demo request
- List of products interested in
- Next steps (team will contact within 1 business day)
- Professional branding

### 2. Contact Form Confirmation

Sent when a visitor submits the Contact Us form.

**Template Location**: `app/routers/leads.py` - `send_visitor_contact_confirmation()`

**Includes**:
- Confirmation of message receipt
- Subject line echo
- Response timeframe (1-2 business days)
- Professional branding

## Security Best Practices

1. **Never commit `.env` to version control**
   - The `.env` file is already in `.gitignore`
   - Never share your SMTP credentials

2. **Use App Passwords** (for Gmail)
   - Never use your main Gmail password
   - App Passwords can be revoked if compromised

3. **Production Recommendations**:
   - Use a dedicated email service (SendGrid, Mailgun, Amazon SES)
   - Set up proper SPF, DKIM, and DMARC records
   - Monitor email delivery rates
   - Implement rate limiting

## Testing Checklist

After setup, test the following:

- [ ] Run `python test_email.py` successfully
- [ ] Submit RFD form and receive confirmation email
- [ ] Submit Contact form and receive confirmation email
- [ ] Verify emails are not going to spam
- [ ] Check that admin still receives alert emails
- [ ] Verify graceful failure (if SMTP is down, form still submits)

## Getting Help

If you encounter issues:

1. Check the backend logs for error messages
2. Run the test script: `python test_email.py`
3. Verify environment variables are loaded: print them in the backend
4. Check the troubleshooting section above

## Files Modified

- `.env` - SMTP configuration
- `app/routers/leads.py` - Email sending logic
- `test_email.py` - SMTP testing script (new)
- `SMTP_SETUP_GUIDE.md` - This guide (new)
