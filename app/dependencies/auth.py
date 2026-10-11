"""
Authentication dependencies for FastAPI endpoints.
Verifies Next.js session cookies to ensure only authenticated admins can access protected endpoints.
"""
from fastapi import HTTPException, Cookie, status
from typing import Optional
import jwt
import os

# Session secret must match the Next.js SESSION_SECRET
SESSION_SECRET = os.getenv("SESSION_SECRET")
if not SESSION_SECRET:
    raise RuntimeError(
        "SESSION_SECRET environment variable is required for JWT authentication. "
        "Please set it in your .env file to match the Next.js session secret."
    )


async def get_current_admin(session: Optional[str] = Cookie(None)) -> dict:
    """
    Dependency that verifies the Next.js session cookie and extracts admin user information.

    Args:
        session: The session cookie value from the request

    Returns:
        dict: Admin user payload from the JWT token

    Raises:
        HTTPException: 401 if session is missing, invalid, or expired
    """
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in to access this resource.",
        )

    try:
        # Decode and verify the JWT token
        payload = jwt.decode(
            session,
            SESSION_SECRET,
            algorithms=["HS256"]
        )

        # Extract admin information from the payload
        # Next.js session uses "userId" key (see app/lib/session.ts)
        admin_id = payload.get("userId")
        admin_email = payload.get("email")

        if not admin_id or not admin_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session data",
            )

        return {
            "id": admin_id,
            "email": admin_email,
            "name": payload.get("name", "Admin")
        }

    except jwt.InvalidTokenError:  # covers bad signature, expiry and malformed tokens
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
        )
