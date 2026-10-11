# Quick Start Guide

Get the Nexus IT Solutions Portal running in 15 minutes with this step-by-step checklist.

## Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Node.js 20+ installed ([Download](https://nodejs.org/))
- [ ] Python 3.9+ installed ([Download](https://python.org/))
- [ ] Git installed ([Download](https://git-scm.com/))
- [ ] A Supabase account ([Sign up](https://supabase.com/))
- [ ] A code editor (VS Code, Sublime, etc.)
- [ ] Two terminal windows open

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/GannonCIS/SOFT210-SP26-TeamB.git
cd SOFT210-SP26-TeamB

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt
```

**Expected time:** 2-3 minutes

---

### 2. Setup Supabase Database

#### 2.1 Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - Name: `nexus-it-portal`
   - Database Password: (create and save it!)
   - Region: (choose closest to you)
4. Click "Create new project"
5. Wait 2-3 minutes

#### 2.2 Run Database Setup

1. In Supabase dashboard → "SQL Editor" → "New Query"
2. Paste the contents of each file in `supabase/migrations/` (oldest first) and click "Run"
3. Then paste and run `supabase/seed.sql` to add the product catalog
4. Wait for "Success" messages

Or, with the Supabase CLI: `supabase db push --db-url "$DATABASE_URL"` (see DATABASE_SETUP.md)

**Expected time:** 2 minutes

---

### 3. Get Supabase Credentials

#### 3.1 Get API Credentials

In Supabase dashboard:
1. Click "Project Settings" (gear icon)
2. Click "API"
3. Copy these two values:
   - **Project URL** → Save as `SUPABASE_URL`
   - **service_role key** → Save as `SUPABASE_SERVICE_ROLE_KEY`

#### 3.2 Get Database URL

In Supabase dashboard:
1. Click "Project Settings"
2. Click "Database"
3. Scroll to "Connection string"
4. Select "Session pooler" tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your database password
7. Save as `DATABASE_URL`

**Format:**
```
postgresql://postgres.xxx:password@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

**Expected time:** 2 minutes

---

### 4. Configure Environment

#### 4.1 Backend Environment (.env)

```bash
# Copy template
cp .env.example .env
```

Edit `.env` and fill in:
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
DATABASE_URL=postgresql://postgres.xxx:pass@aws-1-us-west-2.pooler.supabase.com:6543/postgres
SESSION_SECRET=your-random-32-char-string-here
FRONTEND_URL=http://localhost:3000
```

**Generate SESSION_SECRET:**
- Mac/Linux: `openssl rand -base64 32`
- Windows: Use any random 32+ character string

#### 4.2 Frontend Environment (.env.local)

```bash
# Create .env.local
echo "NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000" > .env.local
```

**Expected time:** 3 minutes

---

### 5. Start the Application

#### Terminal 1 - Backend

```bash
python -m uvicorn main:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

#### Terminal 2 - Frontend

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.4
- Local:        http://localhost:3000
✓ Ready in 2s
```

**Expected time:** 1 minute

---

### 6. Verify Everything Works

#### 6.1 Check Homepage

1. Open [http://localhost:3000](http://localhost:3000)
2. Should see Nexus IT homepage
3. Click "View Products"

#### 6.2 Check Products

1. Go to [http://localhost:3000/products](http://localhost:3000/products)
2. Should see 6 products listed
3. Click on any product to see details

#### 6.3 Check Admin Dashboard

1. Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Log in with the admin account you created via `python scripts/create_admin.py --email you@example.com --name "Your Name"`
3. Should see admin dashboard with:
   - Analytics metrics
   - Sample lead (John Smith)
   - Demo Requests section
   - Contact Messages section

#### 6.4 Check Backend API

1. Go to [http://localhost:8000/docs](http://localhost:8000/docs)
2. Should see FastAPI Swagger documentation
3. All endpoints should be listed

**Expected time:** 2 minutes

---

## Quick Test

Test the complete flow:

1. **Browse products** → [http://localhost:3000/products](http://localhost:3000/products)
2. **Click on a product** → View product details
3. **Click "Request Demo"** → Fill out RFD form
4. **Submit form** → Should see success message
5. **Go to admin** → See your new lead in dashboard

---

## Troubleshooting

### Frontend shows "Failed to fetch"

**Problem:** Can't connect to backend

**Fix:**
```bash
# Make sure .env.local exists
cat .env.local

# Should show:
# NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# If not, create it:
echo "NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000" > .env.local

# Restart frontend
npm run dev
```

### Backend crashes on startup

**Problem:** Database connection error

**Fix:**
1. Check `.env` file has correct credentials
2. Verify Supabase project is not paused
3. Test connection:
   ```bash
   python scripts/verify_database.py
   ```

### Admin login fails

**Problem:** Wrong credentials or database not set up

**Fix:**
1. Verify you applied the migrations in `supabase/migrations/`
2. Make sure you created an admin account (none are seeded by default)
3. Create one:
   ```bash
   python scripts/create_admin.py --email you@example.com --name "Your Name"
   ```

### Port already in use

**Problem:** Port 3000 or 8000 already taken

**Fix:**
```bash
# Frontend - use different port
npm run dev -- -p 3001

# Backend - use different port
python -m uvicorn main:app --reload --port 8001

# Update .env.local if you change backend port
```

---

## What's Next?

### Optional: Configure Email (SMTP)

To enable email confirmations:

1. See [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
2. Configure Gmail App Password
3. Update `.env` with SMTP credentials
4. Test with `python scripts/test_email.py`

### Run Comprehensive Tests

See [docs/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md) for full test suite.

### Change Admin Password

For production use:

```sql
-- Run in Supabase SQL Editor
UPDATE admin_users
SET password_hash = crypt('your-new-password', gen_salt('bf'))
WHERE email = 'admin@nexusit.com';
```

### Explore Features

- **Analytics Dashboard** - View business metrics
- **Lead Management** - Manage customer inquiries
- **Lead Notes** - Add notes to leads
- **Status Updates** - Track lead progress
- **Product Management** - View product catalog

---

## Quick Reference

### URLs

| Page | URL |
|------|-----|
| Homepage | http://localhost:3000 |
| Products | http://localhost:3000/products |
| Contact | http://localhost:3000/contact |
| Admin Login | http://localhost:3000/admin/login |
| Admin Dashboard | http://localhost:3000/admin |
| API Docs | http://localhost:8000/docs |

### Admin Accounts

No default credentials exist. Create accounts with `python scripts/create_admin.py --email you@example.com --name "Your Name"`.

### Commands

| Task | Command |
|------|---------|
| Start Backend | `python -m uvicorn main:app --reload --port 8000` |
| Start Frontend | `npm run dev` |
| Create Admin | `python scripts/create_admin.py` |
| Test Email | `python scripts/test_email.py` |
| Verify Database | `python scripts/verify_database.py` |
| Test RFD Form | `python scripts/test_rfd_submission.py` |

### Files to Check

| File | Purpose |
|------|---------|
| `.env` | Backend environment variables |
| `.env.local` | Frontend environment variables |
| `supabase/migrations/` | Database schema (apply in order) |
| `supabase/seed.sql` | Product catalog seed data |
| `requirements.txt` | Python dependencies |
| `package.json` | Node.js dependencies |

---

## Need More Help?

- **Full Setup Guide:** [README.md](../../README.md)
- **Database Details:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Email Setup:** [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
- **Testing Guide:** [docs/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md)
- **Known Issues:** [docs/SPRINT_ISSUES_AND_RESOLUTIONS.md](../archive/SPRINT_ISSUES_AND_RESOLUTIONS.md)

---

**Total Setup Time:** ~15 minutes

✅ You're all set! Start building and testing the application.
