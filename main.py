from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.routers import products, events, rfd, auth, leads, debug_db, analytics
from app.db_pg import close_pool
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do — the asyncpg pool is created lazily on first use.
    yield
    # Shutdown: close the asyncpg pool if it was opened.
    await close_pool()


app = FastAPI(title="Nexus IT Backend", lifespan=lifespan)

# Configure CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "Cookie"],
    expose_headers=["Set-Cookie"],
)

# Add TrustedHost middleware in production to prevent host header attacks
if os.getenv("NODE_ENV") == "production":
    backend_domain = os.getenv("BACKEND_DOMAIN")
    if not backend_domain:
        raise RuntimeError(
            "BACKEND_DOMAIN environment variable is required in production. "
            "Set it to your backend domain (e.g., 'api.example.com') to prevent host header attacks."
        )
    allowed_hosts = [backend_domain]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# Include routers
app.include_router(products.router)
app.include_router(events.router)
app.include_router(rfd.router)
app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(debug_db.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.get("/env-test")
def env_test():
    from os import getenv
    return {
        "DATABASE_URL": getenv("DATABASE_URL"),
        "SECRET_KEY": getenv("SECRET_KEY"),
        "EMAIL_USER": getenv("EMAIL_USER"),
        "FRONTEND_URL": getenv("FRONTEND_URL")
    }
