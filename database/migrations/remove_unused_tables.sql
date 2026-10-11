-- Migration: Remove unused tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[PROJECT_REF]/sql

-- Drop anonymous_engagement_logs (not being used, redundant with visitor_page_views and video_engagement_events)
DROP TABLE IF EXISTS public.anonymous_engagement_logs CASCADE;

-- Drop demo_sessions (not being used)
DROP TABLE IF EXISTS public.demo_sessions CASCADE;
