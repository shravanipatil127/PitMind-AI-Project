"""
Builds the aggregated "race_context" dictionary passed into every
AIProvider method. Centralizing this means the AI layer never talks
to OpenF1 directly — it only sees normalized context.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.services.openf1_client import OpenF1Client, get_openf1_client


def _is_session_live(session: Optional[Dict[str, Any]]) -> bool:
    """Return True only when the session is currently in progress."""
    if not session:
        return False

    date_start = session.get("date_start")
    date_end = session.get("date_end")

    if not date_start or not date_end:
        return False

    try:
        start = datetime.fromisoformat(str(date_start).replace("Z", "+00:00"))
        end = datetime.fromisoformat(str(date_end).replace("Z", "+00:00"))

        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)

        now = datetime.now(timezone.utc)

        return start <= now <= end

    except (ValueError, TypeError):
        return False


async def build_race_context(
    session_key: Optional[int] = None,
    client: Optional[OpenF1Client] = None,
) -> Dict[str, Any]:
    client = client or get_openf1_client()

    session = None

    if session_key is not None:
        try:
            sessions = await client.get_sessions(session_key=session_key)
            session = sessions[0] if sessions else None
        except Exception:
            session = None

    is_live = _is_session_live(session)

    results = await asyncio.gather(
        client.get_positions(session_key),
        client.get_laps(session_key),
        client.get_stints(session_key),
        client.get_weather(session_key),
        client.get_race_control(session_key),
        client.get_intervals(session_key),
        return_exceptions=True,
    )

    keys = [
        "positions",
        "laps",
        "stints",
        "weather",
        "race_control",
        "intervals",
    ]

    context: Dict[str, Any] = {
        "session_key": session_key,
        "session": session or {},
        "is_live": is_live,
    }

    for key, result in zip(keys, results):
        context[key] = result if not isinstance(result, Exception) else []

    return context