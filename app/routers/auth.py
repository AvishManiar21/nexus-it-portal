from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/auth", tags=["auth"])

# Default admin credentials (password hash for "Admin123!")
# In production, these would come from a database
ADMIN_USERS = {
    "admin@nexusit.com": {
        "id": "1",
        "email": "admin@nexusit.com",
        "password_hash": "$2b$12$/XdunaZ.Dpo8MbcJh2fnUut.ez8JaN9EzPp18paudHTG766tdaki2",
        "name": "Admin",
    }
}

SECRET_KEY = os.getenv("SECRET_KEY", "replace_with_your_secret")
ALGORITHM = "HS256"
TOKEN_EXPIRY_HOURS = 8


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    # Generic error message — does not reveal which field was wrong
    invalid_msg = "Invalid email or password"

    user = ADMIN_USERS.get(request.email)
    if not user:
        raise HTTPException(status_code=401, detail=invalid_msg)

    if not bcrypt.checkpw(
        request.password.encode("utf-8"),
        user["password_hash"].encode("utf-8"),
    ):
        raise HTTPException(status_code=401, detail=invalid_msg)

    # Issue JWT
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return LoginResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"]},
    )


@router.get("/me")
def get_current_user(token: str):
    """Verify a token and return the user info."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"id": payload["sub"], "email": payload["email"], "name": payload["name"]}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
