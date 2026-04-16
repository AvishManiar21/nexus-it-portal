-- US-17: View Full Lead Profile Before Outreach
-- Adds budget and session_id columns to leads table
-- so we can display budget range and link anonymous behavioral data to known leads.
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS session_id UUID;

CREATE INDEX IF NOT EXISTS idx_leads_session_id ON leads(session_id);
