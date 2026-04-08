-- US-33: Setup Database With Required Tables
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price FLOAT,
    image_url VARCHAR(500),
    demo_video VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. demo_sessions (FK -> leads, products)
CREATE TABLE IF NOT EXISTS demo_sessions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. engagement_logs (FK -> leads)
CREATE TABLE IF NOT EXISTS engagement_logs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. rfd_submissions (FK -> leads, products)
CREATE TABLE IF NOT EXISTS rfd_submissions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. lead_notes (FK -> leads, admin_users)
CREATE TABLE IF NOT EXISTS lead_notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    admin_id INTEGER NOT NULL REFERENCES admin_users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_demo_sessions_lead_id ON demo_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_product_id ON demo_sessions(product_id);
CREATE INDEX IF NOT EXISTS idx_engagement_logs_lead_id ON engagement_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_lead_id ON rfd_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_product_id ON rfd_submissions(product_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_admin_id ON lead_notes(admin_id);
