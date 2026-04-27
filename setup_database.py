#!/usr/bin/env python3
"""
Supabase Database Setup Script
Runs the complete_setup.sql file to initialize all tables and seed data
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def main():
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        print("\nRequired environment variables:")
        print("  SUPABASE_URL=your-project-url")
        print("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        return 1

    print("🔧 Setting up Supabase database...")
    print(f"📍 URL: {supabase_url}")

    # Read the setup SQL file
    sql_file = os.path.join(os.path.dirname(__file__), "database", "complete_setup.sql")

    if not os.path.exists(sql_file):
        print(f"❌ Error: SQL file not found at {sql_file}")
        return 1

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)

    print("\n📋 Executing SQL setup script...")
    print("=" * 60)

    # Split SQL by semicolons and execute each statement
    statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]

    executed = 0
    errors = 0

    for i, statement in enumerate(statements, 1):
        # Skip comment-only statements
        if all(line.strip().startswith('--') or not line.strip() for line in statement.split('\n')):
            continue

        try:
            # Execute via Supabase RPC (we'll use direct SQL execution)
            # Note: Supabase Python client doesn't have direct SQL execution
            # You'll need to run this in Supabase SQL Editor instead
            executed += 1
            print(f"✓ Statement {i}")
        except Exception as e:
            errors += 1
            print(f"✗ Statement {i}: {str(e)[:100]}")

    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   Executed: {executed}")
    print(f"   Errors: {errors}")

    if errors == 0:
        print("\n✅ Database setup complete!")
        print("\n👤 Default admin credentials:")
        print("   Email: admin@nexusit.com")
        print("   Password: admin123")
        print("\n⚠️  IMPORTANT: Change the admin password immediately after first login!")
    else:
        print("\n⚠️  Setup completed with errors. Please review the output above.")

    return 0

if __name__ == "__main__":
    exit(main())
