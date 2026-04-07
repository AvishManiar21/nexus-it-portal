from fastapi import APIRouter

router = APIRouter(prefix="/leads", tags=["leads"])

@router.get("/")
def get_leads():
    return {"message": "Leads route placeholder"}
