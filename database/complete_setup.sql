-- ===================================================================
-- COMPLETE SUPABASE DATABASE SETUP FOR NEXUS-IT SOLUTIONS PORTAL
-- ===================================================================
-- Run this entire script in Supabase SQL Editor to set up from scratch
-- This creates all tables, indexes, and seed data

-- ===================================================================
-- 1. CREATE ALL TABLES
-- ===================================================================

-- 1.1 admin_users
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    budget VARCHAR(100),
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 products
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

-- 1.4 demo_sessions (FK -> leads, products)
CREATE TABLE IF NOT EXISTS demo_sessions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 engagement_logs (FK -> leads)
CREATE TABLE IF NOT EXISTS engagement_logs (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 rfd_submissions (FK -> leads, products)
CREATE TABLE IF NOT EXISTS rfd_submissions (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7 lead_notes (FK -> leads, admin_users)
CREATE TABLE IF NOT EXISTS lead_notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    admin_id INTEGER NOT NULL REFERENCES admin_users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8 contact_messages (FK -> leads)
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.9 anonymous_engagement_logs
CREATE TABLE IF NOT EXISTS anonymous_engagement_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.10 video_engagement_events
CREATE TABLE IF NOT EXISTS video_engagement_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    event_type VARCHAR(50) NOT NULL,
    watch_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.11 visitor_page_views
CREATE TABLE IF NOT EXISTS visitor_page_views (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.12 lead_status_audit
CREATE TABLE IF NOT EXISTS lead_status_audit (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    admin_id INTEGER NOT NULL REFERENCES admin_users(id),
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- 2. CREATE ALL INDEXES
-- ===================================================================

-- Indexes for demo_sessions
CREATE INDEX IF NOT EXISTS idx_demo_sessions_lead_id ON demo_sessions(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_product_id ON demo_sessions(product_id);

-- Indexes for engagement_logs
CREATE INDEX IF NOT EXISTS idx_engagement_logs_lead_id ON engagement_logs(lead_id);

-- Indexes for rfd_submissions
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_lead_id ON rfd_submissions(lead_id);
CREATE INDEX IF NOT EXISTS idx_rfd_submissions_product_id ON rfd_submissions(product_id);

-- Indexes for lead_notes
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_admin_id ON lead_notes(admin_id);

-- Indexes for contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_lead_id ON contact_messages(lead_id);

-- Indexes for anonymous_engagement_logs
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_session ON anonymous_engagement_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_product ON anonymous_engagement_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_created ON anonymous_engagement_logs(created_at);

-- Indexes for video_engagement_events
CREATE INDEX IF NOT EXISTS idx_video_engagement_session_id ON video_engagement_events(session_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_product_id ON video_engagement_events(product_id);

-- Indexes for visitor_page_views
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_session_id ON visitor_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_product_id ON visitor_page_views(product_id);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);

-- Indexes for lead_status_audit
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_lead_id ON lead_status_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_admin_id ON lead_status_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_created_at ON lead_status_audit(created_at);

-- ===================================================================
-- 3. DISABLE ROW LEVEL SECURITY
-- ===================================================================
-- The FastAPI backend controls access, not Supabase RLS

ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE demo_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE rfd_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_engagement_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_engagement_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_audit DISABLE ROW LEVEL SECURITY;

-- ===================================================================
-- 4. SEED DATA
-- ===================================================================

-- 4.1 Insert admin users (password is 'admin123' hashed with bcrypt)
-- You should change these passwords after initial setup
INSERT INTO admin_users (email, password_hash, name) VALUES
('admin@nexusit.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC0z5p.QZGO', 'Admin User'),
('sales@nexusit.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvC0z5p.QZGO', 'Sales Manager')
ON CONFLICT (email) DO NOTHING;

-- 4.2 Insert products
INSERT INTO products (name, description, category, price, image_url, demo_video) VALUES
('Cloud Infrastructure Suite', 'Enterprise-grade cloud infrastructure management platform with automated scaling, monitoring, and security features.', 'Infrastructure', 2999.99, '/images/products/cloud-suite.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('AI Analytics Dashboard', 'Advanced analytics platform powered by machine learning for real-time business insights and predictive modeling.', 'Analytics', 1999.99, '/images/products/ai-dashboard.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Cybersecurity Shield', 'Comprehensive cybersecurity solution with threat detection, vulnerability scanning, and automated response capabilities.', 'Security', 3499.99, '/images/products/cyber-shield.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('DevOps Automation Platform', 'End-to-end DevOps automation with CI/CD pipelines, container orchestration, and infrastructure as code.', 'DevOps', 2499.99, '/images/products/devops-platform.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Data Lake Solution', 'Scalable data lake architecture for storing, processing, and analyzing petabytes of structured and unstructured data.', 'Data Management', 4999.99, '/images/products/data-lake.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
('Mobile App Development Kit', 'Cross-platform mobile development framework with native performance and seamless cloud integration.', 'Development', 1499.99, '/images/products/mobile-kit.jpg', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
ON CONFLICT DO NOTHING;

-- 4.3 Insert sample leads
INSERT INTO leads (name, email, company, phone, source, status, budget) VALUES
('John Smith', 'john.smith@acmecorp.com', 'Acme Corporation', '+1-555-0101', 'website', 'new', '$10k-$50k'),
('Sarah Johnson', 'sarah.j@techstartup.io', 'TechStartup Inc', '+1-555-0102', 'referral', 'contacted', '$50k-$100k'),
('Michael Chen', 'mchen@enterprise.com', 'Enterprise Solutions Ltd', '+1-555-0103', 'website', 'converted', '$100k+'),
('Emily Rodriguez', 'emily.r@innovate.com', 'Innovate Systems', '+1-555-0104', 'linkedin', 'new', '$10k-$50k'),
('David Park', 'dpark@globaltech.com', 'Global Tech Holdings', '+1-555-0105', 'website', 'contacted', '$50k-$100k')
ON CONFLICT (email) DO NOTHING;

-- 4.4 Insert sample RFD submissions
INSERT INTO rfd_submissions (lead_id, product_id, message, status) VALUES
(1, 1, 'Interested in cloud infrastructure for our growing team of 50+ developers.', 'pending'),
(2, 2, 'Need analytics solution to track customer behavior across multiple channels.', 'pending'),
(3, 3, 'Looking for enterprise security solution. Schedule demo ASAP.', 'approved'),
(5, 4, 'Exploring DevOps automation to streamline our deployment process.', 'pending')
ON CONFLICT DO NOTHING;

-- 4.5 Insert sample contact messages
INSERT INTO contact_messages (lead_id, name, email, subject, message, status) VALUES
(1, 'John Smith', 'john.smith@acmecorp.com', 'Pricing Question', 'Can you provide detailed pricing for teams of 50-100 users?', 'new'),
(4, 'Emily Rodriguez', 'emily.r@innovate.com', 'Integration Support', 'Does your platform integrate with Salesforce and HubSpot?', 'new')
ON CONFLICT DO NOTHING;

-- 4.6 Insert sample lead notes
INSERT INTO lead_notes (lead_id, admin_id, note) VALUES
(3, 1, 'Customer successfully onboarded. Very satisfied with the product.'),
(2, 1, 'Follow up scheduled for next Tuesday to discuss pricing.'),
(5, 2, 'Requested technical documentation. Sent via email.')
ON CONFLICT DO NOTHING;

-- ===================================================================
-- 5. VERIFICATION QUERIES
-- ===================================================================
-- Run these to verify the setup

-- SELECT 'admin_users' AS table_name, COUNT(*) AS row_count FROM admin_users
-- UNION ALL
-- SELECT 'leads', COUNT(*) FROM leads
-- UNION ALL
-- SELECT 'products', COUNT(*) FROM products
-- UNION ALL
-- SELECT 'rfd_submissions', COUNT(*) FROM rfd_submissions
-- UNION ALL
-- SELECT 'contact_messages', COUNT(*) FROM contact_messages
-- UNION ALL
-- SELECT 'lead_notes', COUNT(*) FROM lead_notes;

-- ===================================================================
-- SETUP COMPLETE
-- ===================================================================
-- Default admin credentials:
--   Email: admin@nexusit.com
--   Password: admin123
--
-- IMPORTANT: Change the admin password immediately after first login!
-- ===================================================================
