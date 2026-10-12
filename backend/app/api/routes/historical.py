from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/historical", tags=["historical"])


@router.get("/meetings")
async def get_meetings(year: Optional[int] = Query(None)):
    client = get_openf1_client()
    try:
        return await client.get_meetings(year)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/replay")
async def get_replay_data(
    session_key: int = Query(..., description="Session to replay"),
    driver_number: Optional[int] = Query(None),
):
    """Bundled historical data for a past session, used to drive the replay UI."""
    client = get_openf1_client()
    try:
        laps, positions, stints, weather = (
            await client.get_laps(session_key, driver_number),
            await client.get_positions(session_key),
            await client.get_stints(session_key, driver_number),
            await client.get_weather(session_key),
        )
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "session_key": session_key,
        "laps": laps,
        "positions": positions,
        "stints": stints,
        "weather": weather,
    }
