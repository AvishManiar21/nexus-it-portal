from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/events", tags=["events"])


class ProductViewEvent(BaseModel):
    session_id: str
    product_id: int


@router.post("/product-view")
def record_product_view(event: ProductViewEvent, db=Depends(get_db)):
    try:
        db.table("visitor_page_views").insert({
            "session_id": event.session_id,
            "product_id": event.product_id,
        }).execute()
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to record view")
    return {"status": "ok"}
