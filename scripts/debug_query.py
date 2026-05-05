#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {supabase_url}")
print(f"Key: {supabase_key[:20]}...")

supabase = create_client(supabase_url, supabase_key)

print("\nTrying to select from video_engagement_events...")
try:
    result = supabase.table("video_engagement_events").select("*").execute()
    print(f"Success! Type: {type(result)}")
    print(f"Data type: {type(result.data)}")
    print(f"Data length: {len(result.data)}")
    print(f"Data: {result.data}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
