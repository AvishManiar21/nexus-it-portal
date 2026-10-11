-- Migration: Add lead_id columns for anonymous-to-lead linking (UC-08)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[PROJECT_REF]/sql

-- Add lead_id to visitor_page_views
ALTER TABLE public.visitor_page_views
ADD COLUMN IF NOT EXISTS lead_id integer REFERENCES leads(id) ON DELETE SET NULL;

-- Add lead_id to video_engagement_events
ALTER TABLE public.video_engagement_events
ADD COLUMN IF NOT EXISTS lead_id integer REFERENCES leads(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visitor_page_views_lead_id ON public.visitor_page_views(lead_id);
CREATE INDEX IF NOT EXISTS idx_video_engagement_events_lead_id ON public.video_engagement_events(lead_id);
