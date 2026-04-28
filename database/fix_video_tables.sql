-- Fix video engagement tables to be accessible via Supabase API
-- Run this in Supabase SQL Editor

-- Drop and recreate video_engagement_events
DROP TABLE IF EXISTS public.video_engagement_events CASCADE;

CREATE TABLE public.video_engagement_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    event_type VARCHAR(50) NOT NULL,
    watch_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_engagement_session_id ON public.video_engagement_events(session_id);
CREATE INDEX idx_video_engagement_product_id ON public.video_engagement_events(product_id);
CREATE INDEX idx_video_engagement_created_at ON public.video_engagement_events(created_at);

-- Disable RLS (Row Level Security)
ALTER TABLE public.video_engagement_events DISABLE ROW LEVEL SECURITY;

-- Drop and recreate visitor_page_views
DROP TABLE IF EXISTS public.visitor_page_views CASCADE;

CREATE TABLE public.visitor_page_views (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visitor_page_views_session_id ON public.visitor_page_views(session_id);
CREATE INDEX idx_visitor_page_views_product_id ON public.visitor_page_views(product_id);
CREATE INDEX idx_visitor_page_views_viewed_at ON public.visitor_page_views(viewed_at);

-- Disable RLS
ALTER TABLE public.visitor_page_views DISABLE ROW LEVEL SECURITY;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verify tables are accessible
SELECT 'video_engagement_events' as table_name, COUNT(*) as row_count FROM video_engagement_events
UNION ALL
SELECT 'visitor_page_views', COUNT(*) FROM visitor_page_views;
