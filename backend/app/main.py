"""
PitMind AI backend entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    ai,
    drivers,
    health,
    historical,
    predictions,
    race,
    sessions,
    telemetry,
    tyres,
    weather,
)
from app.api.websocket import router as websocket_router
from app.core.config import get_settings
from app.services.openf1_client import get_openf1_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pitmind")

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Formula 1 Race Engineer — runs fully offline on a rule-based engine by default.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(sessions.router, prefix=settings.API_V1_PREFIX)
app.include_router(drivers.router, prefix=settings.API_V1_PREFIX)
app.include_router(race.router, prefix=settings.API_V1_PREFIX)
app.include_router(telemetry.router, prefix=settings.API_V1_PREFIX)
app.include_router(tyres.router, prefix=settings.API_V1_PREFIX)
app.include_router(weather.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(historical.router, prefix=settings.API_V1_PREFIX)
app.include_router(websocket_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("%s starting up (AI provider: %s)", settings.APP_NAME, settings.AI_PROVIDER)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    await get_openf1_client().close()


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
        "websocket": "/ws/live",
    }
