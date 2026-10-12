"""
Thin async client around the OpenF1 REST API.

All external data access in the app goes through this class so that the
rest of the codebase never talks to OpenF1 directly. This keeps room for
a future FastF1 fallback without touching routers or the AI layer.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger("pitmind.openf1")

settings = get_settings()


class OpenF1Error(Exception):
    """Raised when OpenF1 cannot be reached or returns an error."""


class _TTLCache:
    """A tiny in-memory TTL cache keyed by (path, sorted params)."""

    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        self._store: Dict[str, tuple[float, Any]] = {}

    def _key(self, path: str, params: Dict[str, Any]) -> str:
        return f"{path}?{sorted(params.items())}"

    def get(self, path: str, params: Dict[str, Any]) -> Optional[Any]:
        key = self._key(path, params)
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, path: str, params: Dict[str, Any], value: Any) -> None:
        key = self._key(path, params)
        self._store[key] = (time.monotonic() + self.ttl, value)


class OpenF1Client:
    def __init__(self) -> None:
        self._base_url = settings.OPENF1_BASE_URL
        self._timeout = settings.OPENF1_TIMEOUT_SECONDS
        self._cache = _TTLCache(settings.OPENF1_CACHE_TTL_SECONDS)
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self._base_url, timeout=self._timeout
            )
        return self._client

    async def close(self) -> None:
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def _request(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        retries: int = 3,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        params = {k: v for k, v in (params or {}).items() if v is not None}

        if use_cache:
            cached = self._cache.get(path, params)
            if cached is not None:
                return cached

        client = await self._get_client()
        last_error: Optional[Exception] = None

        for attempt in range(1, retries + 1):
            try:
                response = await client.get(path, params=params)
                response.raise_for_status()
                data = response.json()
                if use_cache:
                    self._cache.set(path, params, data)
                return data
            except (httpx.HTTPError, ValueError) as exc:
                last_error = exc
                logger.warning(
                    "OpenF1 request failed (attempt %s/%s) %s params=%s: %s",
                    attempt,
                    retries,
                    path,
                    params,
                    exc,
                )
                if attempt < retries:
                    await asyncio.sleep(0.5 * attempt)

        raise OpenF1Error(
            f"Failed to fetch {path} after {retries} attempts: {last_error}"
        )

    # ------------------------------------------------------------------
    # Public endpoint wrappers
    # ------------------------------------------------------------------

    async def get_sessions(
        self,
        year: Optional[int] = None,
        country_name: Optional[str] = None,
        session_key: Optional[int] = None,
        session_type: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/sessions",
            {
                "year": year,
                "country_name": country_name,
                "session_key": session_key,
                "session_type": session_type,
            },
        )

    async def get_latest_session(self) -> Optional[Dict[str, Any]]:
        sessions = await self._request("/sessions", {"session_key": "latest"})
        return sessions[0] if sessions else None

    async def get_drivers(
        self, session_key: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request("/drivers", {"session_key": session_key or "latest"})

    async def get_positions(
        self, session_key: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/position", {"session_key": session_key or "latest"}
        )

    async def get_laps(
        self, session_key: Optional[int] = None, driver_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/laps",
            {"session_key": session_key or "latest", "driver_number": driver_number},
        )

    async def get_car_data(
        self, session_key: Optional[int] = None, driver_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        params = {
            "session_key": session_key or "latest",
            "driver_number": driver_number,
        }

        return await self._request("/car_data", params)

    async def get_stints(
        self, session_key: Optional[int] = None, driver_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/stints",
            {"session_key": session_key or "latest", "driver_number": driver_number},
        )

    async def get_weather(
        self, session_key: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request("/weather", {"session_key": session_key or "latest"})

    async def get_race_control(
        self, session_key: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/race_control", {"session_key": session_key or "latest"}
        )

    async def get_intervals(
        self, session_key: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        return await self._request(
            "/intervals", {"session_key": session_key or "latest"}
        )

    async def get_meetings(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        return await self._request("/meetings", {"year": year})


_client_singleton: Optional[OpenF1Client] = None


def get_openf1_client() -> OpenF1Client:
    global _client_singleton
    if _client_singleton is None:
        _client_singleton = OpenF1Client()
    return _client_singleton
