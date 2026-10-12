from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import CarTelemetry
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/telemetry", tags=["telemetry"])


@router.get("", response_model=List[CarTelemetry])
async def get_telemetry(
    session_key: Optional[int] = Query(None),
    driver_number: Optional[int] = Query(None, description="Recommended: telemetry volume is large"),
):
    client = get_openf1_client()
    try:
        return await client.get_car_data(session_key, driver_number)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
