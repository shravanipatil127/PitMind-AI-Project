"""
Shared Pydantic models for API requests/responses.
These mirror the OpenF1 API shapes but are normalized for our frontend.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class HealthStatus(BaseModel):
    status: str = "ok"
    app_name: str
    ai_provider: str
    llm_configured: bool
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Session(BaseModel):
    session_key: int
    session_name: str
    session_type: Optional[str] = None
    meeting_key: Optional[int] = None
    location: Optional[str] = None
    country_name: Optional[str] = None
    circuit_short_name: Optional[str] = None
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    year: Optional[int] = None


class Driver(BaseModel):
    driver_number: int
    broadcast_name: Optional[str] = None
    full_name: Optional[str] = None
    name_acronym: Optional[str] = None
    team_name: Optional[str] = None
    team_colour: Optional[str] = None
    country_code: Optional[str] = None
    headshot_url: Optional[str] = None
    session_key: Optional[int] = None


class Position(BaseModel):
    driver_number: int
    position: int
    date: Optional[str] = None
    session_key: Optional[int] = None


class LapTime(BaseModel):
    driver_number: int
    lap_number: Optional[int] = None
    lap_duration: Optional[float] = None
    duration_sector_1: Optional[float] = None
    duration_sector_2: Optional[float] = None
    duration_sector_3: Optional[float] = None
    is_pit_out_lap: Optional[bool] = None
    date_start: Optional[str] = None
    session_key: Optional[int] = None


class CarTelemetry(BaseModel):
    driver_number: int
    date: Optional[str] = None
    speed: Optional[float] = None
    rpm: Optional[float] = None
    n_gear: Optional[int] = None
    throttle: Optional[float] = None
    brake: Optional[float] = None
    drs: Optional[int] = None
    session_key: Optional[int] = None


class TyreStint(BaseModel):
    driver_number: int
    stint_number: Optional[int] = None
    compound: Optional[str] = None
    lap_start: Optional[int] = None
    lap_end: Optional[int] = None
    tyre_age_at_start: Optional[int] = None
    session_key: Optional[int] = None


class WeatherReading(BaseModel):
    date: Optional[str] = None
    air_temperature: Optional[float] = None
    track_temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    pressure: Optional[float] = None
    session_key: Optional[int] = None


class RaceControlMessage(BaseModel):
    date: Optional[str] = None
    category: Optional[str] = None
    message: Optional[str] = None
    flag: Optional[str] = None
    scope: Optional[str] = None
    driver_number: Optional[int] = None
    session_key: Optional[int] = None


class TyreCompound(str, Enum):
    SOFT = "SOFT"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    INTERMEDIATE = "INTERMEDIATE"
    WET = "WET"
    UNKNOWN = "UNKNOWN"


class TyreWearPrediction(BaseModel):
    driver_number: int
    compound: TyreCompound
    estimated_age_laps: int
    estimated_wear_pct: float
    degradation_trend: str
    confidence: float


class PitWindowPrediction(BaseModel):
    driver_number: int
    recommended_lap_earliest: int
    recommended_lap_latest: int
    reasoning: str
    confidence: float


class OvertakePrediction(BaseModel):
    attacker_driver_number: int
    defender_driver_number: int
    gap_seconds: Optional[float]
    likelihood_pct: float
    reasoning: str


class WinnerPrediction(BaseModel):
    driver_number: int
    win_probability_pct: float
    reasoning: str


class SafetyCarRisk(BaseModel):
    risk_level: str
    risk_pct: float
    reasoning: str


class StrategyRecommendation(BaseModel):
    driver_number: int
    summary: str
    pit_window: Optional[PitWindowPrediction] = None
    tyre_analysis: Optional[TyreWearPrediction] = None
    risk_notes: List[str] = Field(default_factory=list)


class RaceExplanation(BaseModel):
    headline: str
    narrative: str
    key_factors: List[str] = Field(default_factory=list)
    generated_by: str  # "rule_based" | "llm"


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    session_key: Optional[int] = None
    driver_number: Optional[int] = None
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    generated_by: str  # "rule_based" | "llm"
    suggestions: List[str] = Field(default_factory=list)


class PredictionsBundle(BaseModel):
    session_key: Optional[int]
    generated_by: str
    tyre_predictions: List[TyreWearPrediction] = Field(default_factory=list)
    pit_windows: List[PitWindowPrediction] = Field(default_factory=list)
    overtakes: List[OvertakePrediction] = Field(default_factory=list)
    winner: List[WinnerPrediction] = Field(default_factory=list)
    safety_car: Optional[SafetyCarRisk] = None
