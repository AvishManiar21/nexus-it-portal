import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Use override=True to ensure .env file values take precedence over system env vars
load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

# Create a single shared client instance
_supabase_client: Client = None


def get_db() -> Client:
    """FastAPI dependency that returns the Supabase client."""
    global _supabase_client
    # Create client if it doesn't exist
    if _supabase_client is None:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_client
