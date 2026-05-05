#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# Delete by ID
supabase.table("video_engagement_events").delete().in_("id", [1, 2]).execute()
print("Test data deleted")

# Check
result = supabase.table("video_engagement_events").select("*").execute()
print(f"Remaining rows: {len(result.data)}")
