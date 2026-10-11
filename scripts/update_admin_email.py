#!/usr/bin/env python3
"""
Update Admin Email Script
Changes an admin user's email address in admin_users.

That address is used both to log in (/auth/login looks admins up by it)
and to receive RFD alert emails.

Usage:
    python scripts/update_admin_email.py --old admin@nexusit.com --new you@example.com
"""

import argparse
import os
import sys

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()


def main():
    parser = argparse.ArgumentParser(description="Change an admin user's email address")
    parser.add_argument("--old", required=True, help="Current admin email")
    parser.add_argument("--new", required=True, help="New admin email")
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return 1

    supabase = create_client(supabase_url, supabase_key)

    try:
        result = supabase.table("admin_users").update({"email": args.new}).eq("email", args.old).execute()
    except Exception as e:
        print(f"[ERROR] {e}")
        return 1

    if not result.data:
        # Deliberately no fallback: never change an account the caller didn't name
        print(f"[NOT FOUND] No admin with email {args.old}; nothing changed.")
        return 1

    print(f"[SUCCESS] Updated {args.old} -> {args.new}")
    print("Use the new address to log in; RFD alerts will also go there.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
