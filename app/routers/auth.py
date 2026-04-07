from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/")
def get_auth():
    return {"message": "Auth route placeholder"}
