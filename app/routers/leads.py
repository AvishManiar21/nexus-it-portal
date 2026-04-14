from fastapi import APIRouter, Depends, Query
from supabase import Client
from typing import Optional

from app.database import get_db

router = APIRouter(prefix="/leads", tags=["leads"])

SORTABLE_COLUMNS = {"name", "email", "company", "status", "created_at"}


@router.get("/")
def get_leads(
    search: Optional[str] = Query(None, description="Search by company, contact name, or email"),
    sort_by: Optional[str] = Query("created_at", description="Column to sort by"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Client = Depends(get_db),
):
    """Return all leads with optional search and sort."""
    if sort_by not in SORTABLE_COLUMNS:
        sort_by = "created_at"
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"

    query = db.table("leads").select("id, name, email, company, status, created_at")

    if search and search.strip():
        term = search.strip()
        query = query.or_(
            f"company.ilike.%{term}%,name.ilike.%{term}%,email.ilike.%{term}%"
        )

    descending = sort_order == "desc"
    query = query.order(sort_by, desc=descending)

    result = query.execute()
    return result.data
