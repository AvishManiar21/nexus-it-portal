#!/usr/bin/env python3
"""
Run database migration for anonymous engagement logs table
"""
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
    print("\nPlease create a .env file with:")
    print("SUPABASE_URL=your_supabase_url")
    print("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
    exit(1)

# Read migration SQL
try:
    with open("database/add_anonymous_engagement_table.sql", "r") as f:
        migration_sql = f.read()
except FileNotFoundError:
    print("❌ Error: Migration file not found")
    print("Please run this script from the project root directory")
    exit(1)

print("🚀 Running migration: add_anonymous_engagement_table.sql")
print("=" * 60)

# Execute migration via Supabase REST API
try:
    # Use Supabase's REST API to execute raw SQL
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # Alternative: Use psycopg2 if available
    try:
        import psycopg2
        from urllib.parse import urlparse

        # Parse connection string from SUPABASE_URL
        # Note: You'll need the actual database connection string, not just the API URL
        print("\n⚠️  Direct SQL execution requires database connection string")
        print("\n📋 Migration SQL to execute:")
        print("-" * 60)
        print(migration_sql)
        print("-" * 60)

        print("\n✅ To run this migration manually:")
        print("\n1. Go to Supabase Dashboard: https://app.supabase.com")
        print("2. Select your project")
        print("3. Go to SQL Editor (left sidebar)")
        print("4. Create a new query")
        print("5. Copy and paste the SQL above")
        print("6. Click 'Run' or press Ctrl+Enter")

    except ImportError:
        print("\n📋 Migration SQL:")
        print("-" * 60)
        print(migration_sql)
        print("-" * 60)

        print("\n✅ To run this migration:")
        print("\nOption 1 - Supabase Dashboard (Recommended):")
        print("  1. Go to: https://app.supabase.com")
        print("  2. Select your project: okagcanluxirdgrkxfcq")
        print("  3. SQL Editor → New Query")
        print("  4. Paste the SQL above and run")

        print("\nOption 2 - Command Line (if you have psql):")
        print("  psql <your_connection_string> -f database/add_anonymous_engagement_table.sql")

except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
