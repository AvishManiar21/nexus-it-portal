# Database Setup Guide

This guide provides detailed instructions for setting up the Nexus IT Solutions Portal database using Supabase.

## Overview

The application uses Supabase PostgreSQL as its database. Supabase provides a hosted PostgreSQL database with a user-friendly interface, making it easy to set up and manage.

## Prerequisites

- A Supabase account (free tier works perfectly)
- Internet connection
- Web browser

## Option 1: Supabase Setup (Recommended)

This is the recommended method and takes approximately 10 minutes.

### Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email if prompted

### Step 2: Create New Project

1. Click "New Project" in your Supabase dashboard
2. Fill in project details:
   - **Name:** `nexus-it-portal` (or any name you prefer)
   - **Database Password:** Create a strong password and **save it** (you'll need this later)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** Free tier is sufficient
3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

### Step 3: Create the Database Schema

The schema lives in `supabase/migrations/` (applied in filename order), and the
product catalog in `supabase/seed.sql`.

**Option A: Supabase CLI (recommended)**
```bash
supabase db push --db-url "$DATABASE_URL"
```
Get `DATABASE_URL` in Step 4 first. The CLI records which migrations ran, so
re-running only applies new ones.

**Option B: SQL Editor**
1. In your Supabase project dashboard, click "SQL Editor" → "New Query"
2. Paste the contents of each file in `supabase/migrations/`, oldest first, and click "Run"
3. Then paste and run `supabase/seed.sql` to add the product catalog

**What this creates:**
- All 10 tables, foreign keys and indexes
- Row Level Security enabled on every table (the backend uses the service-role
  key, so the app works; the public anon key gets no access)
- The 3-product catalog (from `seed.sql`). No admin users; create one with
  `scripts/create_admin.py` (see Step 7).

### Step 4: Obtain Supabase Credentials

You need three pieces of information from Supabase:

#### 4.1 Get Supabase URL and Service Role Key

1. In Supabase dashboard, click "Project Settings" (gear icon in left sidebar)
2. Click "API" in the settings menu
3. Copy these two values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`

**Important:** Use the `service_role` key, not the `anon` key!

#### 4.2 Get Database Connection String

1. In Supabase dashboard, click "Project Settings"
2. Click "Database" in the settings menu
3. Scroll down to "Connection string"
4. Select **"Session pooler"** tab (NOT "Direct connection")
5. The connection string format is:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password from Step 2
7. This is your `DATABASE_URL`

**Example:**
```
postgresql://postgres.abcdefghijk:MyP@ssw0rd@aws-1-us-west-2.pooler.supabase.com:6543/postgres
```

**Important Notes:**
- Use **port 6543** (pooler), not port 5432 (direct)
- If your password contains special characters, URL-encode them:
  - `@` becomes `%40`
  - `!` becomes `%21`
  - `#` becomes `%23`
  - etc.

### Step 5: Configure Environment Variables

1. In your project root, copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor

3. Fill in the Supabase credentials you obtained:
   ```env
   # Supabase REST API
   SUPABASE_URL=https://abcdefghijk.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

   # Direct Postgres connection — REQUIRED for analytics
   DATABASE_URL=postgresql://postgres.abcdefghijk:password@aws-1-us-west-2.pooler.supabase.com:6543/postgres

   # Session JWT (generate random string)
   SESSION_SECRET=your-random-32-character-secret-here

   # SMTP (optional - configure later if needed)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=
   SMTP_PASSWORD=
   FROM_EMAIL=

   # Frontend
   FRONTEND_URL=http://localhost:3000
   ```

4. Generate a random `SESSION_SECRET`:
   - **On Mac/Linux:** Run `openssl rand -base64 32`
   - **On Windows PowerShell:** Run `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`
   - Or use any random 32+ character string

5. Save the `.env` file

### Step 6: Verify Database Setup

Run the verification script to confirm everything is set up correctly:

```bash
python scripts/verify_database.py
```

**Expected output:**
```
Connected to Supabase successfully!
Checking tables...
✓ admin_users
✓ leads
✓ products
✓ rfd_submissions
✓ lead_notes
✓ contact_messages
... (more tables)

All expected tables exist!
```

If you see errors, check:
- Your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- You applied the migrations in `supabase/migrations/` successfully
- Your Supabase project is active (not paused)

### Step 7: Test Admin Login

1. Start the backend:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```

2. Start the frontend (in another terminal):
   ```bash
   npm run dev
   ```

3. Open browser to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

4. Log in with the admin account you created via `python scripts/create_admin.py --email you@example.com --name "Your Name"`

5. You should see the admin dashboard with analytics and sample data

## Option 2: Local PostgreSQL Setup (Advanced)

If you prefer to run PostgreSQL locally instead of using Supabase:

### Requirements
- PostgreSQL 13+ installed locally
- `psql` command-line tool

### Steps

1. **Create database:**
   ```bash
   createdb nexusit
   ```

2. **Run setup script:**
   ```bash
   for f in supabase/migrations/*.sql; do psql nexusit -f "$f"; done
   psql nexusit -f supabase/seed.sql
   ```

3. **Configure .env:**
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/nexusit
   SUPABASE_URL=  # Leave empty
   SUPABASE_SERVICE_ROLE_KEY=  # Leave empty
   ```

**Limitations:**
- Some Supabase-specific features won't work
- You'll need to modify code that uses Supabase client
- Authentication may need adjustments

## Troubleshooting

### Error: "relation 'leads' does not exist"

**Problem:** Database tables weren't created

**Solution:**
1. Go to Supabase SQL Editor
2. Apply the migrations again (see Step 3)
3. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### Error: "Could not connect to database"

**Problem:** Invalid DATABASE_URL

**Solution:**
1. Verify you're using the **Session pooler** connection string (port 6543)
2. Check your password is URL-encoded (e.g., `@` → `%40`)
3. Ensure Supabase project is not paused
4. Try pinging the host: `ping aws-1-us-west-2.pooler.supabase.com`

### Error: "Authentication required"

**Problem:** Wrong SERVICE_ROLE_KEY

**Solution:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (not `anon` key)
3. Paste into `SUPABASE_SERVICE_ROLE_KEY` in `.env`
4. Restart backend server

### Error: "Admin user not found"

**Problem:** Admin users weren't created

**Solution:**
Run the admin creation script:
```bash
python scripts/create_admin.py
```

### Supabase Project Paused

**Problem:** Free tier projects pause after 1 week of inactivity

**Solution:**
1. Go to Supabase Dashboard
2. Click "Restore project"
3. Wait 2-3 minutes for project to activate
4. Restart your backend server

### Port 6543 vs 5432

**Problem:** Confusion about which port to use

**Answer:**
- **Port 6543** (Session Pooler) - **Use this!** Works with asyncpg, IPv4 compatible
- **Port 5432** (Direct Connection) - Requires IPv6, may have DNS issues

Always use the **Session Pooler** (6543) for best compatibility.

## Database Schema Overview

The database consists of 10 tables:

### Core Tables
- **admin_users** - Administrator accounts for dashboard access
- **leads** - Customer/visitor profiles captured from forms
- **products** - IT solution catalog
- **rfd_submissions** - Request for Demo form submissions
- **contact_messages** - Contact form submissions

### Tracking Tables
- **visitor_page_views** - Page view tracking (anonymous + lead-linked)
- **video_engagement_events** - Video interaction tracking
- **engagement_logs** - General engagement tracking (legacy)

### Management Tables
- **lead_notes** - Admin notes on leads
- **lead_status_audit** - Lead status change history

## Seed Data

`supabase/seed.sql` adds the product catalog:
1. Cloud Infrastructure Suite
2. AI Analytics Dashboard
3. Cybersecurity Shield

No admin users are seeded: create them with `python scripts/create_admin.py --email you@example.com --name "Your Name"`.

## Schema Changes

**Existing databases (one-time):** a database created before `supabase/migrations/`
existed already has the baseline schema. Mark the baseline as applied so
`db push` only runs newer migrations:
```bash
supabase migration repair --status applied 20261011000000 --db-url "$DATABASE_URL"
```

1. Create a new migration: `supabase migration new <short_name>` (creates a
   timestamped file in `supabase/migrations/`)
2. Write the SQL in that file
3. Apply it: `supabase db push --db-url "$DATABASE_URL"`
4. Commit the file with the code that needs it

## Next Steps

After database setup is complete:

1. ✅ Database tables created
2. ✅ Admin users created
3. ✅ Environment variables configured
4. → Configure SMTP for emails (optional) - See [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
5. → Run the application - See [README.md](../../README.md)
6. → Test all features - See [docs/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md)

## Security Notes

### Production Checklist

Before deploying to production:

- [ ] Use strong, unique admin passwords (12+ characters)
- [ ] Use strong, unique `SESSION_SECRET`
- [ ] Rotate `SERVICE_ROLE_KEY` if exposed
- [ ] Enable database backups in Supabase
- [ ] Review and restrict database access
- [ ] Enable HTTPS for all connections
- [ ] Set up monitoring and alerts

### Password Security

The application uses bcrypt for password hashing with:
- Cost factor: 12 (default)
- Random salt per password
- Never stores plain text passwords

## Additional Resources

- **Supabase Documentation:** [https://supabase.com/docs](https://supabase.com/docs)
- **PostgreSQL Documentation:** [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)
- **SQL Editor Guide:** [https://supabase.com/docs/guides/database/sql-editor](https://supabase.com/docs/guides/database/sql-editor)

## Need Help?

If you encounter issues not covered in this guide:

1. Check [docs/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md) for verification steps
2. Review [docs/SPRINT_ISSUES_AND_RESOLUTIONS.md](../archive/SPRINT_ISSUES_AND_RESOLUTIONS.md) for known issues
3. Run `python scripts/verify_database.py` to diagnose
4. Check Supabase project logs in dashboard
5. Contact course instructor or team members

---

**Setup Time Estimate:** 10-15 minutes for first-time setup
