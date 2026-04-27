-- Ensure tables are in public schema and accessible via API
-- Run this in Supabase SQL Editor

-- Drop and recreate anonymous_engagement_logs in public schema
DROP TABLE IF EXISTS public.anonymous_engagement_logs CASCADE;

CREATE TABLE public.anonymous_engagement_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES public.products(id),
    product_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anonymous_engagement_session ON public.anonymous_engagement_logs(session_id);
CREATE INDEX idx_anonymous_engagement_product ON public.anonymous_engagement_logs(product_id);
CREATE INDEX idx_anonymous_engagement_created ON public.anonymous_engagement_logs(created_at);

ALTER TABLE public.anonymous_engagement_logs DISABLE ROW LEVEL SECURITY;

-- Drop and recreate lead_status_audit in public schema
DROP TABLE IF EXISTS public.lead_status_audit CASCADE;

CREATE TABLE public.lead_status_audit (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES public.leads(id),
    admin_id INTEGER NOT NULL REFERENCES public.admin_users(id),
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lead_status_audit_lead_id ON public.lead_status_audit(lead_id);
CREATE INDEX idx_lead_status_audit_admin_id ON public.lead_status_audit(admin_id);
CREATE INDEX idx_lead_status_audit_created_at ON public.lead_status_audit(created_at);

ALTER TABLE public.lead_status_audit DISABLE ROW LEVEL SECURITY;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
