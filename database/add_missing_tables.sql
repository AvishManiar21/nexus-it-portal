-- Add missing tables that weren't created in the initial setup

-- 1. anonymous_engagement_logs
CREATE TABLE IF NOT EXISTS anonymous_engagement_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_session ON anonymous_engagement_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_product ON anonymous_engagement_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_created ON anonymous_engagement_logs(created_at);

ALTER TABLE anonymous_engagement_logs ENABLE ROW LEVEL SECURITY;

-- 2. lead_status_audit
CREATE TABLE IF NOT EXISTS lead_status_audit (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    admin_id INTEGER NOT NULL REFERENCES admin_users(id),
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_status_audit_lead_id ON lead_status_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_admin_id ON lead_status_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_created_at ON lead_status_audit(created_at);

ALTER TABLE lead_status_audit ENABLE ROW LEVEL SECURITY;
