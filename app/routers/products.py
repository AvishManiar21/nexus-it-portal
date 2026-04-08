from fastapi import APIRouter, HTTPException, Depends
from supabase import Client
from app.database import get_db

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/")
def get_products(db: Client = Depends(get_db)):
    result = db.table("products").select("*").execute()
    return result.data


@router.get("/{product_id}")
def get_product(product_id: int, db: Client = Depends(get_db)):
    result = db.table("products").select("*").eq("id", product_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data[0]
