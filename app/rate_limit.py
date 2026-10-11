"""
Per-client rate limiting for public endpoints (slowapi).

The RFD/contact forms and admin login reach FastAPI through the Next.js
server, so the TCP peer is the Next server rather than the visitor. The
client IP is therefore taken from X-Forwarded-For, but only when the
immediate peer is listed in TRUSTED_PROXY_IPS; otherwise anyone could
spoof the header to dodge the limit.

Limits are stored in memory, i.e. per worker process. Use a shared
storage backend (e.g. RATE_LIMIT_STORAGE_URI=redis://...) when running
multiple workers.
"""
import os

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

TRUSTED_PROXY_IPS = {
    ip.strip()
    for ip in os.getenv("TRUSTED_PROXY_IPS", "127.0.0.1,::1").split(",")
    if ip.strip()
}

LOGIN_LIMIT = "5/minute"
FORM_LIMIT = "5/minute;20/hour"
EVENT_LIMIT = "120/minute"


def client_ip(request: Request) -> str:
    peer = get_remote_address(request)
    if peer in TRUSTED_PROXY_IPS:
        forwarded = request.headers.get("x-forwarded-for", "")
        first = forwarded.split(",")[0].strip()
        if first:
            return first
    return peer


limiter = Limiter(
    key_func=client_ip,
    storage_uri=os.getenv("RATE_LIMIT_STORAGE_URI", "memory://"),
)
