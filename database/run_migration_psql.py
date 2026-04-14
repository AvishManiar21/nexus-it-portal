#!/usr/bin/env python3
"""
Run database migration using direct PostgreSQL connection
"""
import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    print("Error: Missing SUPABASE_URL in .env")
    exit(1)

# Parse the Supabase URL to get project reference
parsed = urlparse(SUPABASE_URL)
project_ref = parsed.hostname.split('.')[0] if parsed.hostname else None

if not project_ref:
    print("Error: Could not parse project reference from SUPABASE_URL")
    exit(1)

# Construct direct PostgreSQL connection string
# Format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
# Note: You'll need the database password, not the API key

print("=" * 60)
print("Database Migration Tool")
print("=" * 60)
print(f"\nProject Reference: {project_ref}")
print(f"Supabase URL: {SUPABASE_URL}")

# Read migration SQL
try:
    with open("database/add_anonymous_engagement_table.sql", "r", encoding="utf-8") as f:
        migration_sql = f.read()
except FileNotFoundError:
    print("\nError: Migration file not found")
    print("Please run from project root directory")
    exit(1)

print("\nMigration SQL:")
print("-" * 60)
print(migration_sql)
print("-" * 60)

print("\nTo run this migration, you have two options:")
print("\nOption 1 - Supabase Dashboard (Recommended):")
print(f"  1. Visit: https://app.supabase.com/project/{project_ref}/sql/new")
print("  2. Paste the SQL shown above")
print("  3. Click 'Run'")

print("\nOption 2 - Direct Database Connection:")
print("  If you have the database password:")
print(f"    CONNECTION_STRING='postgresql://postgres:[PASSWORD]@db.{project_ref}.supabase.co:5432/postgres'")
print("    psql $CONNECTION_STRING -f database/add_anonymous_engagement_table.sql")

print("\n" + "=" * 60)

# Attempt to check if table exists using Supabase client
try:
    from supabase import create_client

    if SUPABASE_SERVICE_ROLE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        try:
            # Try to query the table
            result = supabase.table("anonymous_engagement_logs").select("id").limit(1).execute()
            print("\nStatus: Table 'anonymous_engagement_logs' already exists!")
            print("Migration may have already been applied.")
        except Exception:
            print("\nStatus: Table 'anonymous_engagement_logs' does NOT exist yet.")
            print("Please run the migration using one of the options above.")
except ImportError:
    pass

print("=" * 60)
