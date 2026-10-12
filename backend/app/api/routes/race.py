from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import LapTime, Position, RaceControlMessage
from app.services.openf1_client import OpenF1Error, get_openf1_client

router = APIRouter(prefix="/race", tags=["race"])


@router.get("/positions", response_model=List[Position])
async def get_positions(session_key: Optional[int] = Query(None)):
    client = get_openf1_client()
    try:
        return await client.get_positions(session_key)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/laps", response_model=List[LapTime])
async def get_laps(
    session_key: Optional[int] = Query(None),
    driver_number: Optional[int] = Query(None),
):
    client = get_openf1_client()
    try:
        return await client.get_laps(session_key, driver_number)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/control", response_model=List[RaceControlMessage])
async def get_race_control(session_key: Optional[int] = Query(None)):
    client = get_openf1_client()
    try:
        return await client.get_race_control(session_key)
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/leaderboard")
async def get_leaderboard(session_key: Optional[int] = Query(None)):
    """Convenience endpoint: positions merged with driver metadata."""
    client = get_openf1_client()
    try:
        positions, drivers = await client.get_positions(session_key), await client.get_drivers(
            session_key
        )
    except OpenF1Error as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    driver_by_number = {d["driver_number"]: d for d in drivers if "driver_number" in d}

    latest_by_driver = {}
    for p in positions:
        driver = p.get("driver_number")
        if driver is None:
            continue
        existing = latest_by_driver.get(driver)
        if not existing or (p.get("date") or "") >= (existing.get("date") or ""):
            latest_by_driver[driver] = p

    leaderboard = []
    for driver, pos in latest_by_driver.items():
        meta = driver_by_number.get(driver, {})
        leaderboard.append(
            {
                "driver_number": driver,
                "position": pos.get("position"),
                "full_name": meta.get("full_name"),
                "team_name": meta.get("team_name"),
                "team_colour": meta.get("team_colour"),
                "name_acronym": meta.get("name_acronym"),
                "headshot_url": meta.get("headshot_url"),
            }
        )

    leaderboard.sort(key=lambda x: x["position"] or 999)
    return leaderboard
