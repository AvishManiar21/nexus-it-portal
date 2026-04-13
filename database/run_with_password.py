#!/usr/bin/env python3
"""
Run database migration with direct PostgreSQL connection
"""
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Database connection details
DB_HOST = "db.okagcanluxirdgrkxfcq.supabase.co"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "7yUdjA6kC9xY3WeW"

# Read migration SQL
with open("database/add_anonymous_engagement_table.sql", "r", encoding="utf-8") as f:
    migration_sql = f.read()

print("=" * 60)
print("Running Database Migration")
print("=" * 60)
print(f"Host: {DB_HOST}")
print(f"Database: {DB_NAME}")
print(f"User: {DB_USER}")
print()

try:
    # Connect to PostgreSQL with SSL
    print("Connecting to database...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode='require'
    )

    print("Connected successfully!")

    # Create cursor
    cur = conn.cursor()

    # Execute migration
    print("\nExecuting migration SQL...")
    cur.execute(migration_sql)

    # Commit changes
    conn.commit()

    print("Migration executed successfully!")

    # Verify table was created
    print("\nVerifying table creation...")
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'anonymous_engagement_logs'
    """)

    result = cur.fetchone()

    if result:
        print(f"SUCCESS - Table 'anonymous_engagement_logs' created successfully!")

        # Check indexes
        cur.execute("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'anonymous_engagement_logs'
        """)

        indexes = cur.fetchall()
        print(f"\nSUCCESS - Created {len(indexes)} indexes:")
        for idx in indexes:
            print(f"  - {idx[0]}")
    else:
        print("ERROR - Table not found")

    # Close cursor and connection
    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print("Migration completed successfully!")
    print("=" * 60)

except psycopg2.Error as e:
    print(f"\nX Database error: {e}")
    print("\nMigration failed!")
    exit(1)

except Exception as e:
    print(f"\nX Error: {e}")
    exit(1)
