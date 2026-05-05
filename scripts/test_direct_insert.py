#!/usr/bin/env python3
"""Test inserting directly and checking immediately"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to: {supabase_url}")
supabase = create_client(supabase_url, supabase_key)

# Test 1: Try to insert
print("\n1. Attempting insert...")
try:
    result = supabase.table("video_engagement_events").insert({
        "session_id": "123e4567-e89b-12d3-a456-426614174000",
        "product_id": 1,
        "event_type": "start",
        "watch_duration_seconds": 0
    }).execute()
    print(f"Insert result: {result}")
    print(f"Insert data: {result.data}")
except Exception as e:
    print(f"Insert failed: {e}")

# Test 2: Try to select
print("\n2. Attempting select...")
try:
    result = supabase.table("video_engagement_events").select("*").execute()
    print(f"Select result count: {len(result.data)}")
    print(f"Select data: {result.data}")
except Exception as e:
    print(f"Select failed: {e}")

# Test 3: Check if table exists in schema
print("\n3. Checking table in information_schema...")
try:
    # This won't work via PostgREST but let's try
    result = supabase.table("information_schema.tables").select("table_name").eq("table_name", "video_engagement_events").execute()
    print(f"Table check: {result.data}")
except Exception as e:
    print(f"Table check failed (expected): {e}")

# Test 4: List all accessible tables
print("\n4. Trying to list what tables are accessible via API...")
try:
    # Check the OpenAPI schema endpoint
    import requests
    response = requests.get(f"{supabase_url}/rest/v1/")
    print(f"API root status: {response.status_code}")
except Exception as e:
    print(f"API check failed: {e}")
