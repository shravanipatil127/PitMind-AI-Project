from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import Driver
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("", response_model=List[Driver])
async def list_drivers(session_key: Optional[int] = Query(None)):
    client = get_openf1_client()
    try:
        data = await client.get_drivers(session_key)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return data
