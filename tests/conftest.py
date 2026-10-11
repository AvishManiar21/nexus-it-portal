"""Test configuration: dummy settings so the app can be imported without a real .env."""
import os
import sys
from pathlib import Path

# Set before the app is imported; override=True in the app's load_dotenv calls
# only matters when a .env file exists, which CI does not have.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-that-is-at-least-32-chars")
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/test")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
