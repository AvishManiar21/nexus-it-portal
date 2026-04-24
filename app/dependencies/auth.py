"""
Authentication dependencies for FastAPI endpoints.
Verifies Next.js session cookies to ensure only authenticated admins can access protected endpoints.
"""
from fastapi import HTTPException, Cookie, status
from typing import Optional
from jose import jwt, JWTError
import os

# Session secret must match the Next.js SESSION_SECRET
SESSION_SECRET = os.getenv("SESSION_SECRET", "nexus-it-session-secret-change-me")


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
        admin_id = payload.get("id")
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

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
        )
