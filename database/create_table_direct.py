#!/usr/bin/env python3
"""
Create anonymous_engagement_logs table using Supabase Management API
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("Attempting to create table via Supabase Management API...")
print("=" * 60)

# Read the SQL
with open("database/add_anonymous_engagement_table.sql", "r") as f:
    sql = f.read()

# Try using Supabase's query endpoint with service role key
# This uses the PostgREST admin endpoints
url = f"{SUPABASE_URL}/rest/v1/"

headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Try to use pg_catalog to execute SQL
# This is a workaround attempt
try:
    # Method 1: Try using a query parameter (likely won't work)
    exec_url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    response = requests.post(
        exec_url,
        headers=headers,
        json={"query": sql}
    )

    if response.status_code == 200:
        print("SUCCESS! Migration completed.")
        exit(0)
    else:
        print(f"Method 1 failed: {response.status_code} - {response.text}")

except Exception as e:
    print(f"Method 1 error: {e}")

print("\n" + "=" * 60)
print("Unable to execute SQL directly via API.")
print("\nThe Supabase REST API does not support direct SQL execution.")
print("You must run the migration via the Supabase Dashboard.")
print("\nQuick link: https://app.supabase.com/project/okagcanluxirdgrkxfcq/sql/new")
print("\nSQL to run:")
print("-" * 60)
print(sql)
print("-" * 60)
