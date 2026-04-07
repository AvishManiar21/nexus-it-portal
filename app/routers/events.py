from fastapi import APIRouter

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/")
def get_events():
    return {"message": "Events route placeholder"}
