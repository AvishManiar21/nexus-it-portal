import os
import uuid
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"URL: {url}")
print(f"Key starts with: {key[:20]}...")

supabase = create_client(url, key)

# Use a brand new unique session ID
unique_session = str(uuid.uuid4())
print(f"Inserting with unique session ID: {unique_session}")

result = supabase.table("video_engagement_events").insert({
    "session_id": unique_session,
    "product_id": 1,
    "event_type": "start",
    "watch_duration_seconds": 999
}).execute()

print(f"Result data: {result.data}")
print(f"Result count: {result.count}")

# Immediately query to verify it persisted
verify = supabase.table("video_engagement_events").select("*").eq("session_id", unique_session).execute()
print(f"\nVerification query returned {len(verify.data)} rows:")
print(verify.data)
