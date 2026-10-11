"""Test configuration: dummy settings so the app can be imported without a real .env."""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest

# Set before the app is imported; override=True in the app's load_dotenv calls
# only matters when a .env file exists, which CI does not have.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SESSION_SECRET", "test-session-secret-that-is-at-least-32-chars")
os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost:5432/test")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    """Rate limits are per IP and in memory; reset so tests never trip each other."""
    import main

    main.app.state.limiter.reset()
    yield


@pytest.fixture
def admin_headers():
    """Cookie header for a valid admin session, signed like app/lib/session.ts does."""
    import jwt

    token = jwt.encode(
        {"userId": "1", "email": "admin@example.com", "name": "Admin",
         "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
        os.environ["SESSION_SECRET"],
        algorithm="HS256",
    )
    return {"Cookie": f"session={token}"}
