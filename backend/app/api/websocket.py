"""
Live race WebSocket broadcaster.

Clients connect to /ws/live and receive periodic snapshots combining
leaderboard, weather, and a lightweight AI summary. Handles disconnects
gracefully and never crashes the loop on a single bad payload.
"""
from __future__ import annotations

import asyncio
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.services.ai.factory import get_ai_provider
from app.services.openf1_client import OpenF1Error, get_openf1_client
from app.services.race_context import build_race_context

logger = logging.getLogger("pitmind.websocket")
router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        stale: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:  # noqa: BLE001
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)


manager = ConnectionManager()


async def _build_snapshot(session_key: int | None) -> dict:
    client = get_openf1_client()
    provider = get_ai_provider()

    try:
        positions = await client.get_positions(session_key)
        drivers = await client.get_drivers(session_key)
        weather = await client.get_weather(session_key)
    except OpenF1Error as exc:
        logger.warning("Snapshot fetch failed: %s", exc)
        return {"type": "error", "detail": str(exc)}

    driver_by_number = {d.get("driver_number"): d for d in drivers}
    latest_positions: dict[int, dict] = {}
    for p in positions:
        driver = p.get("driver_number")
        if driver is None:
            continue
        existing = latest_positions.get(driver)
        if not existing or (p.get("date") or "") >= (existing.get("date") or ""):
            latest_positions[driver] = p

    leaderboard = sorted(
        (
            {
                "driver_number": driver,
                "position": pos.get("position"),
                "full_name": driver_by_number.get(driver, {}).get("full_name"),
                "team_colour": driver_by_number.get(driver, {}).get("team_colour"),
            }
            for driver, pos in latest_positions.items()
        ),
        key=lambda x: x["position"] or 999,
    )

    context = await build_race_context(session_key)
    try:
        safety_car = await provider.assess_safety_car_risk(context)
        safety_car_payload = safety_car.model_dump()
    except Exception as exc:  # noqa: BLE001
        logger.warning("AI snapshot enrichment failed: %s", exc)
        safety_car_payload = None

    return {
        "type": "snapshot",
        "leaderboard": leaderboard,
        "weather": weather[-1] if weather else None,
        "safety_car": safety_car_payload,
        "ai_provider": provider.name,
    }


@router.websocket("/ws/live")
async def live_race_socket(websocket: WebSocket, session_key: int | None = None):
    settings = get_settings()
    await manager.connect(websocket)
    try:
        while True:
            snapshot = await _build_snapshot(session_key)
            await websocket.send_json(snapshot)
            try:
                # Allow the client to send control messages (e.g. change session)
                # without blocking the broadcast cadence indefinitely.
                incoming = await asyncio.wait_for(
                    websocket.receive_json(), timeout=settings.WS_BROADCAST_INTERVAL_SECONDS
                )
                if isinstance(incoming, dict) and "session_key" in incoming:
                    session_key = incoming["session_key"]
            except asyncio.TimeoutError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:  # noqa: BLE001
        logger.warning("WebSocket loop terminated: %s", exc)
        manager.disconnect(websocket)
