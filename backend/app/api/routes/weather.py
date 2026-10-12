from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import WeatherReading
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("", response_model=List[WeatherReading])
async def get_weather(session_key: Optional[int] = Query(None)):
    client = get_openf1_client()
    try:
        return await client.get_weather(session_key)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
