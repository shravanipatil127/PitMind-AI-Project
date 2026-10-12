"""
Application configuration.

All settings are read from environment variables (see .env.example).
Every LLM-related setting is OPTIONAL — the application runs fully
without them, using the built-in rule-based AI engine.
"""
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- General ---
    APP_NAME: str = "PitMind AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # --- OpenF1 ---
    OPENF1_BASE_URL: str = "https://api.openf1.org/v1"
    OPENF1_TIMEOUT_SECONDS: float = 10.0
    OPENF1_CACHE_TTL_SECONDS: int = 5

    # --- AI Provider ---
    # "rule_based" runs fully offline with no API key.
    # "openai_compatible" activates only if OPENAI_API_KEY is set.
    AI_PROVIDER: str = "rule_based"

    # --- Optional LLM enhancement (NOT required to run the app) ---
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_BASE_URL: Optional[str] = "https://api.openai.com/v1"
    LLM_MODEL: Optional[str] = "gpt-4o-mini"

    # --- Database (optional, used only if persistence is enabled) ---
    DATABASE_URL: Optional[str] = None

    # --- WebSocket ---
    WS_BROADCAST_INTERVAL_SECONDS: float = 3.0

    @property
    def llm_configured(self) -> bool:
        """True only when a real LLM key has been supplied."""
        return bool(self.OPENAI_API_KEY)


@lru_cache
def get_settings() -> Settings:
    return Settings()
