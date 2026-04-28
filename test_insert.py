import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Key starts with: {key[:20]}...")

supabase = create_client(url, key)

result = supabase.table("video_engagement_events").insert({
    "session_id": "026f20de-8fa1-44b3-bd3e-ce1b2fca3f01",
    "product_id": 1,
    "event_type": "start",
    "watch_duration_seconds": 5
}).execute()

print(f"Result data: {result.data}")
print(f"Result count: {result.count}")