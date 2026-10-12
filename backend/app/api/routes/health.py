from fastapi import APIRouter

from app.core.config import get_settings
from app.models.schemas import HealthStatus
from app.services.ai.factory import get_ai_provider

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthStatus)
async def health_check() -> HealthStatus:
    settings = get_settings()
    provider = get_ai_provider()
    return HealthStatus(
        status="ok",
        app_name=settings.APP_NAME,
        ai_provider=provider.name,
        llm_configured=settings.llm_configured,
    )
