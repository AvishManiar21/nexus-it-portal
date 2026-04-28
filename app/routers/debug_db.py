from fastapi import APIRouter, Depends
from app.database import get_db, SUPABASE_URL

router = APIRouter(prefix="/debug", tags=["debug"])

@router.get("/db-info")
def get_db_info(db=Depends(get_db)):
    """Debug endpoint to show database connection info"""
    return {
        "supabase_url": SUPABASE_URL,
        "client_type": str(type(db)),
        "test_query": "Run a simple query to verify connection"
    }
