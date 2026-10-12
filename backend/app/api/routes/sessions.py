from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import Session
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.get("", response_model=List[Session])
async def list_sessions(
    year: Optional[int] = Query(None),
    country_name: Optional[str] = Query(None),
    session_type: Optional[str] = Query(None),
):
    client = get_openf1_client()
    try:
        data = await client.get_sessions(
            year=year, country_name=country_name, session_type=session_type
        )
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return data


@router.get("/latest", response_model=Session)
async def latest_session():
    client = get_openf1_client()
    try:
        session = await client.get_latest_session()
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not session:
        raise HTTPException(status_code=404, detail="No session data currently available")
    return session
