"""
OpenAICompatibleProvider — optional LLM-enhanced AIProvider.

This is NOT required to run PitMind AI. It only activates when
OPENAI_API_KEY is present in the environment (see core/config.py and
factory.py). It wraps the rule-based engine for all structured
predictions (which stay deterministic and fast) and adds an LLM call
only for the natural-language explanation and chat endpoints, where a
language model adds real value.

To plug in LangChain, LangGraph, or a different provider entirely,
create another class that implements AIProvider and register it in
factory.py — no other file needs to change.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings
from app.models.schemas import (
    ChatMessage,
    ChatResponse,
    OvertakePrediction,
    PitWindowPrediction,
    RaceExplanation,
    SafetyCarRisk,
    TyreWearPrediction,
    WinnerPrediction,
)
from app.services.ai.provider import AIProvider
from app.services.ai.rule_engine import RuleBasedAIProvider

logger = logging.getLogger("pitmind.ai.llm")


class OpenAICompatibleProvider(AIProvider):
    name = "openai_compatible"

    def __init__(self) -> None:
        self._settings = get_settings()
        # Structured predictions are delegated to the deterministic rule
        # engine — an LLM adds no reliability benefit there, only latency
        # and cost. It is used purely for language generation below.
        self._fallback = RuleBasedAIProvider()

    async def predict_tyre_wear(self, race_context: Dict[str, Any]) -> List[TyreWearPrediction]:
        return await self._fallback.predict_tyre_wear(race_context)

    async def predict_pit_windows(self, race_context: Dict[str, Any]) -> List[PitWindowPrediction]:
        return await self._fallback.predict_pit_windows(race_context)

    async def predict_overtakes(self, race_context: Dict[str, Any]) -> List[OvertakePrediction]:
        return await self._fallback.predict_overtakes(race_context)

    async def predict_winner(self, race_context: Dict[str, Any]) -> List[WinnerPrediction]:
        return await self._fallback.predict_winner(race_context)

    async def assess_safety_car_risk(self, race_context: Dict[str, Any]) -> SafetyCarRisk:
        return await self._fallback.assess_safety_car_risk(race_context)

    async def explain_race(self, race_context: Dict[str, Any]) -> RaceExplanation:
        base = await self._fallback.explain_race(race_context)
        try:
            narrative = await self._call_llm(
                system_prompt=(
                    "You are a Formula 1 race engineer. Rewrite the following factual "
                    "race summary as a concise, engaging briefing for a driver on the "
                    "radio. Keep it under 80 words and do not invent facts."
                ),
                user_prompt=base.narrative,
            )
            return RaceExplanation(
                headline=base.headline,
                narrative=narrative,
                key_factors=base.key_factors,
                generated_by=self.name,
            )
        except Exception as exc:  # noqa: BLE001 - always fall back safely
            logger.warning("LLM explain_race failed, falling back to rule-based: %s", exc)
            return base

    async def chat(
        self, messages: List[ChatMessage], race_context: Dict[str, Any]
    ) -> ChatResponse:
        base = await self._fallback.chat(messages, race_context)
        try:
            history_text = "\n".join(f"{m.role}: {m.content}" for m in messages[-6:])
            reply = await self._call_llm(
                system_prompt=(
                    "You are PitMind AI, a Formula 1 race engineer assistant. Use the "
                    "factual race-analysis context provided to answer the driver/engineer "
                    "clearly and concisely. Do not invent numbers not present in the context."
                ),
                user_prompt=(
                    f"Race context summary: {base.reply}\n\n"
                    f"Conversation so far:\n{history_text}"
                ),
            )
            return ChatResponse(reply=reply, generated_by=self.name, suggestions=base.suggestions)
        except Exception as exc:  # noqa: BLE001 - always fall back safely
            logger.warning("LLM chat failed, falling back to rule-based: %s", exc)
            return base

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> str:
        if not self._settings.llm_configured:
            raise RuntimeError("LLM not configured")

        url = f"{self._settings.OPENAI_BASE_URL.rstrip('/')}/chat/completions"
        headers = {"Authorization": f"Bearer {self._settings.OPENAI_API_KEY}"}
        payload = {
            "model": self._settings.LLM_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 300,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
