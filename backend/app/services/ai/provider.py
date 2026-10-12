"""
AIProvider — the single contract every AI backend must implement.

Swapping intelligence sources (rule engine today, an OpenAI-compatible
LLM, LangChain, LangGraph, or anything else tomorrow) means writing a
new class that implements this interface and registering it in
`factory.py`. Nothing in the routers, websocket layer, or frontend
needs to change.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List

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


class AIProvider(ABC):
    """Abstract base class for all race-intelligence providers."""

    #: Machine-readable identifier surfaced to the frontend
    #: (e.g. "rule_based", "openai_compatible").
    name: str = "base"

    @abstractmethod
    async def predict_tyre_wear(
        self, race_context: Dict[str, Any]
    ) -> List[TyreWearPrediction]:
        """Estimate tyre degradation for each active driver."""

    @abstractmethod
    async def predict_pit_windows(
        self, race_context: Dict[str, Any]
    ) -> List[PitWindowPrediction]:
        """Recommend pit-stop windows per driver."""

    @abstractmethod
    async def predict_overtakes(
        self, race_context: Dict[str, Any]
    ) -> List[OvertakePrediction]:
        """Estimate overtake likelihood for cars running close together."""

    @abstractmethod
    async def predict_winner(
        self, race_context: Dict[str, Any]
    ) -> List[WinnerPrediction]:
        """Estimate win probability, ranked highest first."""

    @abstractmethod
    async def assess_safety_car_risk(
        self, race_context: Dict[str, Any]
    ) -> SafetyCarRisk:
        """Estimate the likelihood of a safety car / VSC intervention."""

    @abstractmethod
    async def explain_race(self, race_context: Dict[str, Any]) -> RaceExplanation:
        """Produce a natural-language explanation of the current race state."""

    @abstractmethod
    async def chat(
        self, messages: List[ChatMessage], race_context: Dict[str, Any]
    ) -> ChatResponse:
        """Answer a free-form race-engineer style question."""
