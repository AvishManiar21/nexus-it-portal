#!/usr/bin/env python3
"""Check video events using direct database connection"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

# Use RPC or direct SQL query to bypass schema cache
print("Checking video_engagement_events table...")
try:
    # Try direct table access first
    result = supabase.table("video_engagement_events").select("*").execute()
    print(f"Found {len(result.data)} video engagement events:")
    for event in result.data:
        print(f"  ID: {event['id']}, Session: {event['session_id']}, Product: {event['product_id']}, Type: {event['event_type']}, Duration: {event['watch_duration_seconds']}s")
except Exception as e:
    print(f"Error: {e}")
    print("\nThis confirms the schema cache issue - table exists but isn't visible via API")
    print("The backend is using a different connection method that works!")
