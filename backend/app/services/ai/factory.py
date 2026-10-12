"""
Factory for selecting the active AIProvider.

This is the ONLY place that decides which concrete AIProvider is used.
Everything else in the app (routers, websocket broadcaster) depends
only on the abstract `AIProvider` interface from provider.py.

Selection logic:
    - If OPENAI_API_KEY is set AND AI_PROVIDER != "rule_based",
      use OpenAICompatibleProvider (LLM-enhanced narrative + chat,
      rule-based structured predictions underneath).
    - Otherwise (the default, out-of-the-box experience), use
      RuleBasedAIProvider — fully offline, no API key required.

To add a new provider (LangChain, LangGraph, a local model, etc.):
    1. Implement AIProvider in a new module under services/ai/.
    2. Add a branch below that returns an instance of it.
No other file in the codebase needs to change.
"""
from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.services.ai.provider import AIProvider
from app.services.ai.rule_engine import RuleBasedAIProvider


@lru_cache
def get_ai_provider() -> AIProvider:
    settings = get_settings()

    if settings.AI_PROVIDER == "openai_compatible" and settings.llm_configured:
        from app.services.ai.llm_provider import OpenAICompatibleProvider

        return OpenAICompatibleProvider()

    # Default: fully offline, zero-config rule-based engine.
    return RuleBasedAIProvider()
