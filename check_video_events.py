#!/usr/bin/env python3
"""Quick script to check video engagement events"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

# Check video_engagement_events
result = supabase.table("video_engagement_events").select("*").execute()
print(f"Video engagement events: {len(result.data)} rows")
for event in result.data:
    print(f"  - Session: {event['session_id']}, Product: {event['product_id']}, Event: {event['event_type']}, Duration: {event['watch_duration_seconds']}s")

# Check visitor_page_views
result2 = supabase.table("visitor_page_views").select("*").execute()
print(f"\nVisitor page views: {len(result2.data)} rows")
for view in result2.data:
    print(f"  - Session: {view['session_id']}, Product: {view['product_id']}")
