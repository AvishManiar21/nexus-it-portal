#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create Admin User Script
Creates a new admin user in the database.

The password is never hardcoded or printed. It is read from the
ADMIN_PASSWORD environment variable (for automation) or prompted for
interactively without echo.

Usage:
    python scripts/create_admin.py --email admin@example.com --name "Admin User"
    ADMIN_PASSWORD='...' python scripts/create_admin.py --email ops@example.com
"""

import argparse
import getpass
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import bcrypt

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

MIN_PASSWORD_LENGTH = 12


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def read_password() -> str:
    """Read the password from ADMIN_PASSWORD or prompt for it (with confirmation)."""
    password = os.getenv("ADMIN_PASSWORD")
    if password is None:
        password = getpass.getpass("Password: ")
        if getpass.getpass("Confirm password: ") != password:
            raise ValueError("Passwords do not match")
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    return password


def main():
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL"), help="Admin email (or ADMIN_EMAIL)")
    parser.add_argument("--name", default=os.getenv("ADMIN_NAME", "Admin User"), help="Display name (or ADMIN_NAME)")
    args = parser.parse_args()

    if not args.email:
        parser.error("--email is required (or set ADMIN_EMAIL)")

    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        return 1

    try:
        password = read_password()
    except ValueError as e:
        print(f"Error: {e}")
        return 1

    print(f"Creating admin user {args.email} ({args.name})")

    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)

    try:
        result = supabase.table("admin_users").insert({
            "email": args.email,
            "password_hash": hash_password(password),
            "name": args.name,
        }).execute()

        if not result.data:
            print("❌ Failed to create admin user")
            return 1

    except Exception as e:
        error_msg = str(e)
        if "duplicate key" in error_msg.lower() or "unique" in error_msg.lower():
            print(f"⚠️  Admin user already exists: {args.email}")
        else:
            print(f"❌ Error: {error_msg}")
        return 1

    print("✅ Admin user created successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
