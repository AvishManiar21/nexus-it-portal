#!/usr/bin/env python3
"""
Run database migration interactively
"""
import os
import sys

# Check if .env file exists
if not os.path.exists('.env'):
    print("No .env file found.")
    print("Please create a .env file with your Supabase credentials.")
    print("\nYou can copy .env.example and fill in the values:")
    print("  cp .env.example .env")
    print("  # Then edit .env with your actual credentials")
    sys.exit(1)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
    sys.exit(1)

# Read migration SQL
with open("database/add_anonymous_engagement_table.sql", "r") as f:
    migration_sql = f.read()

print("Running migration: add_anonymous_engagement_table.sql")
print("=" * 60)

# Use Supabase client to execute
try:
    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Execute via RPC if available
    print("\nMigration SQL:")
    print(migration_sql)
    print("\n" + "=" * 60)

    # Try to execute using postgrest
    # Note: Direct SQL execution requires special setup
    print("\nAttempting to run migration...")

    # Check if table already exists
    try:
        result = supabase.table("anonymous_engagement_logs").select("id").limit(1).execute()
        print("\nTable 'anonymous_engagement_logs' already exists!")
        print("Migration may have already been run.")
    except Exception as e:
        print(f"\nTable does not exist yet. Error: {e}")
        print("\nPlease run the SQL manually via Supabase Dashboard:")
        print("1. Go to https://app.supabase.com")
        print("2. SQL Editor -> New Query")
        print("3. Paste the SQL shown above")
        print("4. Click Run")

except ImportError:
    print("\nError: supabase library not installed")
    print("Install with: pip install supabase")
    sys.exit(1)
except Exception as e:
    print(f"\nError: {e}")
    sys.exit(1)
