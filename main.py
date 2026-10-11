from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.routers import products, events, auth, leads, analytics, insights
from app.db_pg import close_pool
from app.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import logging
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Application logging; set LOG_LEVEL=DEBUG to see per-event tracking logs
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing to do — the asyncpg pool is created lazily on first use.
    yield
    # Shutdown: close the asyncpg pool if it was opened.
    await close_pool()


app = FastAPI(title="Nexus IT Backend", lifespan=lifespan)

# Rate limiting (see app/rate_limit.py); exceeding a limit returns 429
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
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
app.include_router(auth.router)
# insights before leads: GET /leads/scores must not be captured by /leads/{lead_id}
app.include_router(insights.router)
app.include_router(leads.router)
app.include_router(analytics.router)


@app.get("/")
def root():
    return {"message": "Backend is running!"}


@app.get("/health")
def health():
    """Liveness check. Intentionally returns no configuration details."""
    return {"status": "ok"}
