#!/usr/bin/env python3
"""
Update Admin Email Script
Updates the admin user's email to receive alert emails
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def main():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        return 1

    supabase = create_client(supabase_url, supabase_key)

    old_email = "admin@nexusit.com"
    new_email = "avishmaniar24@gmail.com"

    print("=" * 60)
    print("Updating Admin Email for Alerts")
    print("=" * 60)
    print(f"Old email: {old_email}")
    print(f"New email: {new_email}")
    print("=" * 60)

    try:
        # Update the admin user's email
        result = supabase.table("admin_users").update({
            "email": new_email
        }).eq("email", old_email).execute()

        if result.data:
            print(f"\n[SUCCESS] Updated admin email to {new_email}")
            print(f"\nAdmin alerts will now be sent to: {new_email}")
            print(f"\nNote: This updates the email in admin_users table for receiving alerts.")
            print("Login authentication is managed separately in Supabase Auth.")
        else:
            print(f"\n[WARNING] No admin found with email {old_email}")
            print("\nTrying to check existing admins...")

            # List all admins
            admins = supabase.table("admin_users").select("id, email, name").execute()
            if admins.data:
                print(f"\nFound {len(admins.data)} admin user(s):")
                for admin in admins.data:
                    print(f"  - {admin['name']} ({admin['email']})")

                # Try to update the first admin
                first_admin_email = admins.data[0]['email']
                print(f"\nUpdating first admin ({first_admin_email}) to {new_email}...")
                update_result = supabase.table("admin_users").update({
                    "email": new_email
                }).eq("email", first_admin_email).execute()

                if update_result.data:
                    print(f"[SUCCESS] Updated {first_admin_email} to {new_email}")
                else:
                    print(f"[FAILED] Could not update admin email")
            else:
                print("\nNo admin users found in database.")

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")
        return 1

    return 0

if __name__ == "__main__":
    exit(main())
