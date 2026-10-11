# Utility Scripts

This folder contains utility scripts for testing, setup, and database management.

## Setup Scripts

### create_admin.py
Creates default admin users in the database.

**Usage:**
```bash
python scripts/create_admin.py --email you@example.com --name "Your Name"
# or non-interactively:
ADMIN_PASSWORD='...' python scripts/create_admin.py --email you@example.com
```

**What it does:**
- Creates one admin user; the password is prompted for (no echo) or read from `ADMIN_PASSWORD`
- Rejects passwords shorter than 12 characters and never prints the password
- Uses bcrypt for password hashing
- Connects via Supabase API

**When to use:**
- After setting up the database
- If you need to reset admin credentials
- When adding additional admin users

**Requirements:**
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`

---

### verify_database.py
Verifies database schema and checks table creation.

**Usage:**
```bash
python scripts/verify_database.py
```

**What it does:**
- Connects to Supabase
- Lists all tables in the database
- Verifies expected tables exist
- Shows table structure

**When to use:**
- After running database setup SQL
- Troubleshooting database connection issues
- Confirming schema matches expectations

**Requirements:**
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`

---

## Testing Scripts

### test_email.py
Tests SMTP email configuration.

**Usage:**
```bash
python scripts/test_email.py
```

**What it does:**
- Connects to SMTP server
- Sends a test email to verify credentials work
- Reports success or failure

**When to use:**
- After configuring SMTP settings in `.env`
- Troubleshooting email delivery issues
- Verifying Gmail App Password works

**Requirements:**
- SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD in `.env`
- For Gmail: App Password (not regular password)
- See `SMTP_SETUP_GUIDE.md` for setup instructions

---

### test_rfd_submission.py
Tests the RFD (Request for Demo) form submission flow end-to-end.

**Usage:**
```bash
python scripts/test_rfd_submission.py
```

**What it does:**
- Submits a test RFD form to the backend
- Creates a lead in the database
- Sends confirmation email to visitor
- Sends alert email to admin
- Links anonymous activity to lead

**When to use:**
- Testing the complete RFD form workflow
- Verifying email confirmations work
- Debugging RFD submission issues

**Requirements:**
- Backend running on http://localhost:8000
- SMTP configured in `.env`
- Database setup completed

**Note:** Edit the test data in the script before running (replace placeholder data).

---

## Admin Management Scripts

### update_admin_email.py
Changes an admin user's email address in the `admin_users` table.

**Usage:**
```bash
python scripts/update_admin_email.py --old admin@nexusit.com --new you@example.com
```

**What it does:**
- Updates the matching row in `admin_users`; if no admin has the `--old` address, nothing is changed
- That address is used both to **log in** and to receive RFD alert emails

**Requirements:**
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`

**Important:** Changing the email also changes the address you log in with.

---

## Diagnostic Scripts

### check_env.py
Quick script to verify environment variables are loaded correctly.

### test_connection.py
Tests basic database connectivity.

Automated tests live in `tests/` and run with `python -m pytest tests` (and in CI on every PR).

---

## Common Issues

### "Module not found" errors
Make sure you're running scripts from the project root:
```bash
cd /path/to/nexus-it-portal
python scripts/script_name.py
```

### "Environment variable not set" errors
Make sure your `.env` file exists and has all required variables. Copy from `.env.example`:
```bash
cp .env.example .env
# Edit .env with your credentials
```

### SMTP errors
- For Gmail, you MUST use an App Password, not your regular password
- See `SMTP_SETUP_GUIDE.md` for detailed setup instructions
- Test with `scripts/test_email.py` first

### Database connection errors
- Verify Supabase project is active (not paused)
- Check credentials in `.env` match Supabase dashboard
- Run `scripts/verify_database.py` to diagnose

---

## Script Dependencies

All scripts require:
```bash
pip install -r requirements.txt
```

Individual script dependencies:
- **create_admin.py**: supabase, bcrypt, python-dotenv
- **verify_database.py**: supabase, python-dotenv
- **test_email.py**: python-dotenv (smtplib is built-in)
- **test_rfd_submission.py**: requests, python-dotenv
- **update_admin_email.py**: supabase, python-dotenv

---

## Best Practices

1. **Always test in development first** - Don't run scripts against production database
2. **Backup before running admin scripts** - Especially update_admin_email.py
3. **Check script output** - Scripts print success/failure messages
4. **Keep credentials secure** - Never commit `.env` file
5. **Run from project root** - Ensures imports and paths work correctly

---

## Need Help?

- Check main `README.md` for general setup
- See `DATABASE_SETUP.md` for database issues
- See `SMTP_SETUP_GUIDE.md` for email issues
- See `TESTING_CHECKLIST.md` for comprehensive testing guide
