#!/usr/bin/env python3
"""Clean up test data"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(supabase_url, supabase_key)

# Delete test rows
print("Deleting test data...")
try:
    result = supabase.table("video_engagement_events").delete().in_("session_id", [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "test-789"
    ]).execute()
    print(f"Deleted {len(result.data)} rows")
except Exception as e:
    print(f"Delete failed: {e}")

# Check remaining rows
result = supabase.table("video_engagement_events").select("*").execute()
print(f"\nRemaining rows: {len(result.data)}")
for event in result.data:
    print(f"  - ID: {event['id']}, Session: {event['session_id'][:8]}..., Event: {event['event_type']}")
