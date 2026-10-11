# Nexus IT Solutions Portal

A full-stack B2B lead management system with public-facing product catalog, demo video tracking, and comprehensive admin dashboard for managing leads and customer inquiries.

## Overview

The Nexus IT Solutions Portal is a web application designed for IT solution providers to showcase their products, capture leads through demo requests and contact forms, and manage customer relationships through a powerful admin interface. The system tracks visitor engagement, manages product information, and provides analytics for business insights.

### Key Features

- **Public Product Catalog** - Browse IT solutions with detailed information and demo videos
- **Request for Demo (RFD) Form** - Visitors can request product demonstrations
- **Contact Form** - Direct communication channel for inquiries
- **Anonymous Visitor Tracking** - Track page views and video engagement before conversion
- **Lead Management** - Comprehensive admin dashboard for managing leads
- **Lead Intelligence** - View complete visitor journey from anonymous browsing to lead conversion
- **Email Notifications** - Automatic confirmations and admin alerts via SMTP
- **Lead Notes & Status** - Track interactions and update lead status with audit history
- **Analytics Dashboard** - Business metrics including conversion rates, lead sources, and product engagement

## Technology Stack

### Frontend
- **Next.js 16.2** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **FastAPI** - Modern Python web framework
- **Python 3.9+** - Backend programming language
- **asyncpg** - Asynchronous PostgreSQL driver for analytics
- **Pydantic v2** - Data validation

### Database
- **Supabase PostgreSQL** - Hosted PostgreSQL with real-time capabilities
- **Direct PostgreSQL Connection** - For analytics queries

### Authentication
- **JWT Tokens** - Secure authentication
- **bcrypt** - Password hashing
- **HttpOnly Cookies** - Secure session management

### Email
- **SMTP** - Email delivery (Gmail App Passwords supported)
- **Background Tasks** - Non-blocking email sending

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** and npm ([Download](https://nodejs.org/))
- **Python 3.9+** and pip ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** (free tier works) - [Create account](https://supabase.com/)

## Quick Start

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
2. In Supabase Dashboard → SQL Editor, run `database/complete_setup.sql`
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

## Default Credentials

No default accounts are seeded. After running `database/complete_setup.sql`, create an admin:

```bash
python scripts/create_admin.py --email you@example.com --name "Your Name"
```

You will be prompted for a password (minimum 12 characters). For non-interactive setups, set `ADMIN_PASSWORD` instead.

## Project Structure

```
.
├── app/                      # Next.js pages + Python backend
│   ├── actions/             # Server actions (auth)
│   ├── admin/               # Admin dashboard pages
│   ├── api/                 # Next.js API routes
│   ├── contact/             # Contact form page
│   ├── products/            # Product catalog pages
│   ├── routers/             # FastAPI backend routers
│   │   ├── analytics.py    # Analytics endpoints
│   │   ├── auth.py         # Authentication
│   │   ├── leads.py        # Lead management
│   │   ├── products.py     # Product catalog
│   │   └── events.py       # Tracking events
│   ├── database.py          # Supabase client
│   └── db_pg.py            # Direct PostgreSQL connection
├── components/              # React components
├── database/               # Database setup and migrations
│   ├── complete_setup.sql # Complete database setup (USE THIS)
│   ├── init.sql           # Basic table creation
│   └── migrations/        # Schema migrations
├── lib/                    # Shared utilities
├── scripts/                # Utility scripts
│   ├── create_admin.py    # Create admin users
│   ├── test_email.py      # Test SMTP configuration
│   └── verify_database.py # Verify database setup
├── .env.example           # Environment variable template
├── main.py                # FastAPI application entry
├── package.json           # Frontend dependencies
└── requirements.txt       # Backend dependencies
```

## Documentation

### Setup Guides
- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Detailed database setup guide
- **[QUICK_START.md](QUICK_START.md)** - Step-by-step setup checklist
- **[SMTP_SETUP_GUIDE.md](SMTP_SETUP_GUIDE.md)** - Email configuration guide

### Reference Documentation
- **[scripts/README.md](scripts/README.md)** - Utility scripts documentation
- **[docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md)** - Comprehensive testing guide
- **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)** - Known issues and workarounds
- **[docs/SPRINT_ISSUES_AND_RESOLUTIONS.md](docs/SPRINT_ISSUES_AND_RESOLUTIONS.md)** - Development issue log
- **[docs/US12_VERIFICATION_CHECKLIST.md](docs/US12_VERIFICATION_CHECKLIST.md)** - User story verification

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

1. Create migration SQL in `database/migrations/`
2. Run migration in Supabase SQL Editor
3. Document in migration file

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

See [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md) for comprehensive testing guide.

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

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) for current known issues and workarounds.

## Course Information

**Course:** SOFT210 - Software Engineering
**Term:** Spring 2026
**Team:** Team B
**Institution:** Gannon University

## Contribution

This repository represents work completed as part of a team project. The majority of the implementation, architecture, and feature development was contributed by Avish Maniar, including:

- Full-stack architecture design and implementation
- FastAPI backend with authentication, lead management, and analytics
- Next.js frontend with Admin dashboard and public-facing pages
- Supabase database schema design and migrations
- Anonymous visitor tracking and lead intelligence features
- Email notification system with SMTP integration
- Analytics dashboard with real-time metrics
- Complete documentation and setup guides

This public repository is maintained independently for portfolio purposes.

## License

This project is created for academic purposes as part of SOFT210 coursework.

## Support

For issues or questions:
1. Check documentation in this repository
2. Review [docs/TESTING_CHECKLIST.md](docs/TESTING_CHECKLIST.md) for common scenarios
3. See [docs/SPRINT_ISSUES_AND_RESOLUTIONS.md](docs/SPRINT_ISSUES_AND_RESOLUTIONS.md) for resolved issues
4. Contact course instructor or team members

---

Built with ❤️ by Team B for SOFT210 Spring 2026
