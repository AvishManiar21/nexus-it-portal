#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Create Admin User Script
Creates a new admin user in the database
"""

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

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def main():
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        return 1

    print("Creating Admin User")
    print("=" * 60)

    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)

    # Default admin credentials
    email = "admin@nexusit.com"
    password = "admin123"
    name = "Admin User"

    print(f"\nEmail: {email}")
    print(f"Name: {name}")
    print(f"Password: {password}")
    print("\nWARNING: Change this password immediately after first login!")

    # Hash the password
    password_hash = hash_password(password)

    try:
        # Insert admin user
        result = supabase.table("admin_users").insert({
            "email": email,
            "password_hash": password_hash,
            "name": name
        }).execute()

        if result.data:
            print("\n✅ Admin user created successfully!")
            print(f"\nLogin credentials:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print("\n⚠️  IMPORTANT: Change this password after first login!")
        else:
            print("\n❌ Failed to create admin user")
            return 1

    except Exception as e:
        error_msg = str(e)
        if "duplicate key" in error_msg.lower() or "unique" in error_msg.lower():
            print("\n⚠️  Admin user already exists!")
            print(f"\nExisting login credentials:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
        else:
            print(f"\n❌ Error: {error_msg}")
            return 1

    # Also create a sales manager account
    print("\n" + "=" * 60)
    print("Creating Sales Manager User")
    print("=" * 60)

    sales_email = "sales@nexusit.com"
    sales_name = "Sales Manager"
    sales_password_hash = hash_password(password)

    try:
        result = supabase.table("admin_users").insert({
            "email": sales_email,
            "password_hash": sales_password_hash,
            "name": sales_name
        }).execute()

        if result.data:
            print(f"\n✅ Sales manager created successfully!")
            print(f"\nLogin credentials:")
            print(f"   Email: {sales_email}")
            print(f"   Password: {password}")
        else:
            print("\n⚠️  Could not create sales manager")

    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            print(f"\n⚠️  Sales manager already exists: {sales_email}")
        else:
            print(f"\n⚠️  Error creating sales manager: {str(e)}")

    print("\n" + "=" * 60)
    return 0

if __name__ == "__main__":
    exit(main())
