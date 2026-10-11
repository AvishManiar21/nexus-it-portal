# Local development

Full setup, configuration and troubleshooting guide. For an overview of the project, see the [README](../../README.md).

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** and npm ([Download](https://nodejs.org/))
- **Python 3.9+** and pip ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** (free tier works) - [Create account](https://supabase.com/)

## Quick Start

### With Docker (one command)

Create the database schema first (step 3 below), then:

```bash
cp .env.example .env    # fill in SUPABASE_*, DATABASE_URL and SESSION_SECRET
docker compose up --build
```

The site is served on http://localhost:3000 and the API on http://localhost:8000. To also run the AI lead insights locally, add `--profile ai`: this starts Ollama and pulls `llama3.2` (about 2 GB) on first run. If you already run Ollama on your machine, set `DOCKER_AI_BASE_URL=http://host.docker.internal:11434/v1` in `.env` instead.

### Without Docker

### 1. Clone the Repository

```bash
git clone https://github.com/AvishManiar21/nexus-it-portal.git
cd nexus-it-portal
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
pip install -r requirements.txt
```

### 3. Setup Database

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions.

**Quick version:**
1. Create a free Supabase project at [supabase.com](https://supabase.com/)
2. Apply the schema: `supabase db push --db-url "$DATABASE_URL"`, or run each file in `supabase/migrations/` (then `supabase/seed.sql`) in the SQL Editor
3. Copy your Supabase credentials

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (for analytics)
DATABASE_URL=postgresql://postgres.yourproject:password@aws-1-us-west-2.pooler.supabase.com:6543/postgres

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-32-character-string

# SMTP (optional - for email features)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=your-email@gmail.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

**For frontend**, create `.env.local`:
```bash
echo "NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000" > .env.local
```

### 5. Run the Application

**Start Backend (Terminal 1):**
```bash
python -m uvicorn main:app --reload --port 8000
```

**Start Frontend (Terminal 2):**
```bash
npm run dev
```

### 6. Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Admin Dashboard:** [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Creating an admin

No default accounts are seeded. After applying the database migrations, create an admin:

```bash
python scripts/create_admin.py --email you@example.com --name "Your Name"
```

You will be prompted for a password (minimum 12 characters). For non-interactive setups, set `ADMIN_PASSWORD` instead.

## Project Structure

```
.
â”œâ”€â”€ app/                      # Next.js pages + Python backend
â”‚   â”œâ”€â”€ actions/             # Server actions (auth)
â”‚   â”œâ”€â”€ admin/               # Admin dashboard pages
â”‚   â”œâ”€â”€ api/                 # Next.js API routes
â”‚   â”œâ”€â”€ contact/             # Contact form page
â”‚   â”œâ”€â”€ products/            # Product catalog pages
â”‚   â”œâ”€â”€ routers/             # FastAPI backend routers
â”‚   â”‚   â”œâ”€â”€ analytics.py    # Analytics endpoints
â”‚   â”‚   â”œâ”€â”€ auth.py         # Authentication
â”‚   â”‚   â”œâ”€â”€ leads.py        # Lead management
â”‚   â”‚   â”œâ”€â”€ products.py     # Product catalog
â”‚   â”‚   â””â”€â”€ events.py       # Tracking events
â”‚   â”œâ”€â”€ database.py          # Supabase client
â”‚   â””â”€â”€ db_pg.py            # Direct PostgreSQL connection
â”œâ”€â”€ components/              # React components
â”œâ”€â”€ supabase/               # Database (Supabase CLI layout)
â”‚   â”œâ”€â”€ migrations/        # Schema migrations, applied in filename order
â”‚   â””â”€â”€ seed.sql           # Product catalog seed data
â”œâ”€â”€ lib/                    # Shared utilities
â”œâ”€â”€ scripts/                # Utility scripts
â”‚   â”œâ”€â”€ create_admin.py    # Create admin users
â”‚   â”œâ”€â”€ test_email.py      # Test SMTP configuration
â”‚   â””â”€â”€ verify_database.py # Verify database setup
â”œâ”€â”€ .env.example           # Environment variable template
â”œâ”€â”€ main.py                # FastAPI application entry
â”œâ”€â”€ package.json           # Frontend dependencies
â””â”€â”€ requirements.txt       # Backend dependencies
```

## Documentation

### Setup Guides
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Detailed database setup guide
- **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup checklist
- **[SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)** - Email configuration guide

### Reference Documentation
- **[scripts/README.md](../../scripts/README.md)** - Utility scripts documentation
- **[docs/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md)** - Comprehensive testing guide
- **[Architecture decision records](../adr/)** - Why tracking writes use direct Postgres, and how lead scoring works
- **[docs/SPRINT_ISSUES_AND_RESOLUTIONS.md](../archive/SPRINT_ISSUES_AND_RESOLUTIONS.md)** - Development issue log
- **[docs/US12_VERIFICATION_CHECKLIST.md](../archive/US12_VERIFICATION_CHECKLIST.md)** - User story verification

## Features

### For Visitors

1. **Product Browsing**
   - View IT solution catalog
   - See detailed product information
   - Watch demo videos with tracking

2. **Request Demo (RFD)**
   - Submit demo requests for products
   - Receive email confirmation
   - Track submission status

3. **Contact Form**
   - Send inquiries directly
   - Receive confirmation email
   - Get timely responses

### For Administrators

1. **Lead Management**
   - View all leads in one dashboard
   - Filter and search leads
   - Update lead status (new/contacted/converted)
   - Add notes to leads
   - View complete lead timeline

2. **Lead Intelligence**
   - See visitor's browsing history before conversion
   - Track video engagement
   - View all RFD submissions
   - Access contact form messages
   - Review status change history

3. **Analytics Dashboard**
   - Total leads and new leads this week
   - Most-viewed products
   - Demo completion rates
   - Lead conversion rates
   - Leads by source breakdown

4. **Email Notifications**
   - Receive alerts for new RFD submissions
   - Get notifications for contact form submissions
   - Automatic visitor confirmations

## Email Setup (Optional)

Email features are optional but recommended for production use.

### Gmail Setup

1. Enable 2-Step Verification on your Gmail account
2. Generate an App Password:
   - Visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Create App Password for "Mail"
   - Copy the 16-character password
3. Add to `.env`:
   ```env
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   FROM_EMAIL=your-email@gmail.com
   ```
4. Test with: `python scripts/test_email.py`

See [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md) for detailed instructions.

## API Documentation

Once the backend is running, visit:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Development

### Frontend Development

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Backend Development

```bash
# Run with auto-reload
python -m uvicorn main:app --reload --port 8000

# Run tests
pytest

# Check Python code
pylint app/
```

### Database Migrations

After making schema changes:

1. `supabase migration new <short_name>` (creates a timestamped file in `supabase/migrations/`)
2. Write the SQL in that file
3. Apply it: `supabase db push --db-url "$DATABASE_URL"`

## Troubleshooting

### "Failed to fetch" errors in frontend

**Problem:** Frontend can't connect to backend

**Solution:**
1. Check backend is running on port 8000
2. Verify `.env.local` has `NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000`
3. Restart Next.js dev server after creating `.env.local`

### "Authentication required" errors

**Problem:** Not logged in to admin dashboard

**Solution:**
1. Navigate to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Log in with the account you created via `scripts/create_admin.py`
3. Session expires after 8 hours - log in again

### Database connection errors

**Problem:** Backend can't connect to database

**Solution:**
1. Verify Supabase project is active (not paused)
2. Check `DATABASE_URL` uses pooler connection (port 6543, not 5432)
3. Ensure credentials match Supabase dashboard
4. Run `python scripts/verify_database.py` to diagnose

### Email sending fails

**Problem:** SMTP errors when sending emails

**Solution:**
1. For Gmail, use App Password (not regular password)
2. Test with `python scripts/test_email.py`
3. See [SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)
4. Email features are optional - app works without SMTP configured

### Analytics dashboard shows all zeros

**Problem:** No data to display

**Solution:**
- This is normal for a fresh installation
- Browse products, submit RFD forms to generate data
- Or run `python scripts/test_rfd_submission.py` to create test data

## Testing

```bash
pip install -r requirements-dev.txt
python -m pytest tests --cov=app          # backend: 84 tests, CI fails below 85% coverage

npx playwright install chromium           # once
npm run test:e2e                          # browser: 23 tests against a production build
```

The end-to-end suite builds the app, points it at a backend port nothing listens on, and mocks every API call in the browser, so it never touches your database. The older manual checklist is in [docs/archive/TESTING_CHECKLIST.md](../archive/TESTING_CHECKLIST.md).

**Quick test:**
1. Browse products at [http://localhost:3000/products](http://localhost:3000/products)
2. Submit RFD form for a product
3. Check admin dashboard for new lead
4. Verify email confirmation (if SMTP configured)

## Production Deployment

### Environment Variables

Update production `.env`:
- Use strong `SESSION_SECRET` (32+ random characters)
- Change default admin passwords
- Use production `FRONTEND_URL`
- Configure production SMTP

### Security Checklist

- [ ] Change default admin passwords
- [ ] Use strong session secrets
- [ ] Enable HTTPS
- [ ] Review CORS origins
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Review error handling

## Known Issues

Open bugs are tracked in [GitHub issues](https://github.com/AvishManiar21/nexus-it-portal/issues). Design trade-offs are recorded in the [architecture decision records](../adr/).
