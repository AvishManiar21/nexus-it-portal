-- US-09: Demo Video Engagement Tracking
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS video_engagement_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    event_type VARCHAR(50) NOT NULL,
    watch_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_engagement_session_id ON video_engagement_events(session_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_product_id ON video_engagement_events(product_id);
