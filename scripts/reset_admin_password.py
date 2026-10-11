#!/usr/bin/env python3
"""
Reset Admin Password Script
Sets a new password for an existing admin user.

The password is never hardcoded or printed. It is read from the
ADMIN_PASSWORD environment variable (for automation) or prompted for
interactively without echo. Only the bcrypt hash is stored.

Usage:
    python scripts/reset_admin_password.py --email admin@example.com
"""

import argparse
import getpass
import os
import sys

import bcrypt
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

MIN_PASSWORD_LENGTH = 12


def read_password() -> str:
    """Read the password from ADMIN_PASSWORD or prompt for it (with confirmation)."""
    password = os.getenv("ADMIN_PASSWORD")
    if password is None:
        password = getpass.getpass("New password: ")
        if getpass.getpass("Confirm new password: ") != password:
            raise ValueError("Passwords do not match")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    return password


def main():
    parser = argparse.ArgumentParser(description="Reset an existing admin user's password")
    parser.add_argument("--email", required=True, help="Email of the admin to update")
    args = parser.parse_args()

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        return 1

    supabase = create_client(supabase_url, supabase_key)

    # Check the account exists before asking for a password
    found = supabase.table("admin_users").select("id").eq("email", args.email).execute()
    if not found.data:
        print(f"[NOT FOUND] No admin with email {args.email}; nothing changed.")
        return 1

    try:
        password = read_password()
    except ValueError as e:
        print(f"Error: {e}")
        return 1

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    try:
        supabase.table("admin_users").update({"password_hash": password_hash}).eq("email", args.email).execute()
    except Exception as e:
        print(f"[ERROR] {e}")
        return 1

    print(f"[SUCCESS] Password updated for {args.email}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
