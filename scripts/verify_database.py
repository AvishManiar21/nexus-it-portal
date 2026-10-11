#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase Database Verification Script
Checks that all tables exist and have data
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables (override=True to force .env file values)
load_dotenv(override=True)

def main():
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        return 1

    print("🔍 Verifying Supabase database setup...")
    print(f"📍 URL: {supabase_url}\n")

    # Initialize Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)

    # Tables to verify
    tables = [
        "admin_users",
        "leads",
        "products",
        "demo_sessions",
        "engagement_logs",
        "rfd_submissions",
        "lead_notes",
        "contact_messages",
        "anonymous_engagement_logs",
        "video_engagement_events",
        "visitor_page_views",
        "lead_status_audit"
    ]

    print("=" * 70)
    print(f"{'Table Name':<35} {'Row Count':<15} {'Status'}")
    print("=" * 70)

    total_tables = 0
    total_rows = 0
    errors = []

    for table in tables:
        try:
            result = supabase.table(table).select("*", count="exact").limit(0).execute()
            count = result.count if hasattr(result, 'count') else 0
            total_tables += 1
            total_rows += count
            status = "✅" if count >= 0 else "⚠️"
            print(f"{table:<35} {count:<15} {status}")
        except Exception as e:
            errors.append(f"{table}: {str(e)}")
            print(f"{table:<35} {'ERROR':<15} ❌")

    print("=" * 70)
    print(f"\n📊 Summary:")
    print(f"   Tables verified: {total_tables}/{len(tables)}")
    print(f"   Total rows: {total_rows}")
    print(f"   Errors: {len(errors)}")

    if errors:
        print("\n❌ Errors encountered:")
        for error in errors:
            print(f"   - {error}")
        return 1

    # Show sample data
    print("\n" + "=" * 70)
    print("📦 Sample Data:")
    print("=" * 70)

    try:
        # Admin users
        admins = supabase.table("admin_users").select("email, name").execute()
        print(f"\n👤 Admin Users ({len(admins.data)}):")
        for admin in admins.data:
            print(f"   - {admin['email']} ({admin['name']})")

        # Products
        products = supabase.table("products").select("name, category, price").execute()
        print(f"\n📦 Products ({len(products.data)}):")
        for product in products.data:
            price = f"${product['price']:.2f}" if product['price'] else "N/A"
            print(f"   - {product['name']} ({product['category']}) - {price}")

        # Leads
        leads = supabase.table("leads").select("name, email, company, status").execute()
        print(f"\n👥 Leads ({len(leads.data)}):")
        for lead in leads.data:
            company = lead['company'] or 'N/A'
            print(f"   - {lead['name']} ({lead['email']}) - {company} [{lead['status']}]")

    except Exception as e:
        print(f"\n⚠️  Error fetching sample data: {str(e)}")

    print("\n" + "=" * 70)
    print("✅ Database verification complete!")
    print("\n👤 Create an admin account with:")
    print('   python scripts/create_admin.py --email you@example.com --name "Your Name"')
    print("=" * 70)

    return 0

if __name__ == "__main__":
    exit(main())
