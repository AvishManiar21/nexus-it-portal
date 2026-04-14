-- Migration: Add anonymous engagement tracking table
-- Purpose: Track engagement events for anonymous visitors before they become leads

CREATE TABLE IF NOT EXISTS anonymous_engagement_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on session_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_session ON anonymous_engagement_logs(session_id);

-- Create index on product_id for analytics queries
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_product ON anonymous_engagement_logs(product_id);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_anonymous_engagement_created ON anonymous_engagement_logs(created_at);
