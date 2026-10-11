#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test Supabase connection and table access
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    print("Testing Supabase Connection")
    print("=" * 60)
    print(f"URL: {supabase_url}")
    print(f"Key: {supabase_key[:20]}...")

    supabase: Client = create_client(supabase_url, supabase_key)

    # Test each problematic table
    print("\nTesting anonymous_engagement_logs:")
    try:
        result = supabase.table("anonymous_engagement_logs").select("*").limit(1).execute()
        print(f"  ✅ Success! Rows: {len(result.data)}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    print("\nTesting lead_status_audit:")
    try:
        result = supabase.table("lead_status_audit").select("*").limit(1).execute()
        print(f"  ✅ Success! Rows: {len(result.data)}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    print("\nTesting admin login:")
    try:
        result = supabase.table("admin_users").select("email,name").execute()
        print(f"  ✅ Success! Admin users:")
        for admin in result.data:
            print(f"     - {admin['email']} ({admin['name']})")
    except Exception as e:
        print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    main()
