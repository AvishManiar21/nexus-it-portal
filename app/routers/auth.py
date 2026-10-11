from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from supabase import Client
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.dependencies.auth import SESSION_SECRET

router = APIRouter(prefix="/auth", tags=["auth"])

ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 8


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Client = Depends(get_db)):
    # Generic error message — does not reveal which specific field was wrong
    invalid_msg = "Invalid email or password"

    # Query admin_users table by email
    result = (
        db.table("admin_users")
        .select("id, email, password_hash, name")
        .eq("email", request.email)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=401, detail=invalid_msg)

    user = result.data[0]

    if not bcrypt.checkpw(
        request.password.encode("utf-8"),
        user["password_hash"].encode("utf-8"),
    ):
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
