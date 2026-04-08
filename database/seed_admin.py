"""
US-14: Seed Initial Admin User
Inserts a default administrator account into the admin_users table.
Idempotent — skips if the admin already exists (matched by email).
Password is stored as a bcrypt hash and never in plain text.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from app.database import supabase

DEFAULT_ADMIN = {
    "email": "admin@nexusit.com",
    "name": "Admin",
    "password": "Admin123!",
}


def seed():
    email = DEFAULT_ADMIN["email"]

    # Check if admin already exists
    existing = (
        supabase.table("admin_users")
        .select("id")
        .eq("email", email)
        .execute()
    )

    if existing.data:
        print(f"  Skipped (already exists): {email}")
        return

    # Hash the password
    password_hash = bcrypt.hashpw(
        DEFAULT_ADMIN["password"].encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")

    supabase.table("admin_users").insert({
        "email": email,
        "name": DEFAULT_ADMIN["name"],
        "password_hash": password_hash,
    }).execute()

    print(f"  Inserted admin user: {email}")


if __name__ == "__main__":
    print("Seeding admin user...")
    seed()
    print("Done.")
