from fastapi import APIRouter

router = APIRouter(prefix="/rfd", tags=["rfd"])

@router.get("/")
def get_rfd():
    return {"message": "RFD route placeholder"}
