from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from supabase import Client
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.dependencies.auth import SESSION_SECRET
from app.rate_limit import limiter, LOGIN_LIMIT

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 8


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


MAX_PASSWORD_BYTES = 72  # bcrypt's input limit


@router.post("/login", response_model=LoginResponse)
@limiter.limit(LOGIN_LIMIT)
def login(request: Request, credentials: LoginRequest, db: Client = Depends(get_db)):
    # Generic error message — does not reveal which specific field was wrong
    invalid_msg = "Invalid email or password"

    # Query admin_users table by email
    result = (
        db.table("admin_users")
        .select("id, email, password_hash, name")
        .eq("email", credentials.email)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail=invalid_msg)

    user = result.data[0]
    password = credentials.password.encode("utf-8")

    # bcrypt only uses the first 72 bytes, and bcrypt>=5 raises ValueError
    # beyond that. No stored password can be that long (the admin scripts
    # enforce the limit), so treat it as a wrong password rather than a 500.
    if len(password) > MAX_PASSWORD_BYTES or not bcrypt.checkpw(password, user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail=invalid_msg)

    # Issue JWT
    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, SESSION_SECRET, algorithm=ALGORITHM)

    return LoginResponse(
        token=token,
        user={"id": str(user["id"]), "email": user["email"], "name": user["name"]},
    )


@router.get("/me")
def get_current_user(token: str):
    """Verify a token and return the user info."""
    try:
        payload = jwt.decode(token, SESSION_SECRET, algorithms=[ALGORITHM])
        return {"id": payload["sub"], "email": payload["email"], "name": payload["name"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
