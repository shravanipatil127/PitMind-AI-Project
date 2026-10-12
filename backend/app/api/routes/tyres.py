from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import TyreStint
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/tyres", tags=["tyres"])


@router.get("", response_model=List[TyreStint])
async def get_tyre_stints(
    session_key: Optional[int] = Query(None),
    driver_number: Optional[int] = Query(None),
):
    client = get_openf1_client()
    try:
        return await client.get_stints(session_key, driver_number)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
