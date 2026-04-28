"""
Migration: Add lead_id columns to tracking tables for anonymous-to-lead linking
UC-08: Anonymous-to-Lead Linking
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv(override=True)

def run_migration():
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    print("Running migration: Add lead_id to tracking tables")

    # Add lead_id to visitor_page_views
    print("\n1. Adding lead_id column to visitor_page_views...")
    try:
        # Check if column exists
        result = supabase.table('visitor_page_views').select('lead_id').limit(1).execute()
        print("   Column already exists, skipping.")
    except Exception as e:
        if 'column "lead_id" does not exist' in str(e):
            # Column doesn't exist, we need to add it via SQL
            print("   Column doesn't exist. Please run this SQL in Supabase SQL Editor:")
            print("""
   ALTER TABLE public.visitor_page_views
   ADD COLUMN lead_id integer REFERENCES leads(id) ON DELETE SET NULL;
            """)
        else:
            print(f"   Error: {e}")

    # Add lead_id to video_engagement_events
    print("\n2. Adding lead_id column to video_engagement_events...")
    try:
        # Check if column exists
        result = supabase.table('video_engagement_events').select('lead_id').limit(1).execute()
        print("   Column already exists, skipping.")
    except Exception as e:
        if 'column "lead_id" does not exist' in str(e):
            # Column doesn't exist, we need to add it via SQL
            print("   Column doesn't exist. Please run this SQL in Supabase SQL Editor:")
            print("""
   ALTER TABLE public.video_engagement_events
   ADD COLUMN lead_id integer REFERENCES leads(id) ON DELETE SET NULL;
            """)
        else:
            print(f"   Error: {e}")

    print("\n✅ Migration instructions displayed.")
    print("\nAfter running the SQL commands above, the tables will be ready for anonymous-to-lead linking.")

if __name__ == "__main__":
    run_migration()
