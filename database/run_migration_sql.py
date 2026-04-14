#!/usr/bin/env python3
"""
Run database migration using direct SQL execution
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing credentials in .env")
    exit(1)

# Read migration SQL
with open("database/add_anonymous_engagement_table.sql", "r") as f:
    migration_sql = f.read()

print("Running migration via Supabase API...")
print("=" * 60)

# Try using Supabase's query endpoint
# Note: This requires proper API endpoint setup
url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}

# This might not work as exec_sql might not be available
# Let's try anyway
try:
    response = requests.post(
        url,
        headers=headers,
        json={"query": migration_sql}
    )

    if response.status_code == 200:
        print("Migration successful!")
        print(response.json())
    else:
        print(f"API Response: {response.status_code}")
        print(f"Error: {response.text}")
        print("\nPlease run manually via Supabase Dashboard:")
        print("1. Go to https://app.supabase.com")
        print("2. Project: okagcanluxirdgrkxfcq")
        print("3. SQL Editor -> New Query")
        print("4. Paste and run the SQL above")

except Exception as e:
    print(f"Error: {e}")
    print("\nPlease run manually via Supabase Dashboard")
