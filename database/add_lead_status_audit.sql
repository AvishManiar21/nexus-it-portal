-- US-19: Add lead status audit log table
-- Tracks all status changes with admin attribution and timestamps

CREATE TABLE IF NOT EXISTS lead_status_audit (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id),
    admin_id INTEGER NOT NULL REFERENCES admin_users(id),
    old_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_lead_id ON lead_status_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_admin_id ON lead_status_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_audit_created_at ON lead_status_audit(created_at);
