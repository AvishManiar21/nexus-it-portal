-- US-08: Visitor Session Tracking
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE TABLE IF NOT EXISTS visitor_page_views (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_page_views_session_id ON visitor_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_product_id ON visitor_page_views(product_id);
