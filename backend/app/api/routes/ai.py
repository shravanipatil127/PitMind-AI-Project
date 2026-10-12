from fastapi import APIRouter

from app.core.config import get_settings
from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai.factory import get_ai_provider
from app.services.race_context import build_race_context

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status")
async def ai_status():
    settings = get_settings()
    provider = get_ai_provider()
    return {
        "active_provider": provider.name,
        "llm_configured": settings.llm_configured,
        "note": (
            "Running fully offline on the rule-based engine. Set OPENAI_API_KEY, "
            "OPENAI_BASE_URL, and LLM_MODEL in .env and AI_PROVIDER=openai_compatible "
            "to enable LLM-enhanced narratives and chat."
        ),
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    provider = get_ai_provider()
    context = await build_race_context(request.session_key)
    return await provider.chat(request.messages, context)
