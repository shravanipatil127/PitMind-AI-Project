from typing import Optional

from fastapi import APIRouter, Query

from app.models.schemas import PredictionsBundle
from app.services.ai.factory import get_ai_provider
from app.services.race_context import build_race_context

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("", response_model=PredictionsBundle)
async def get_predictions(session_key: Optional[int] = Query(None)):
    provider = get_ai_provider()
    context = await build_race_context(session_key)

    tyre_predictions = await provider.predict_tyre_wear(context)
    pit_windows = await provider.predict_pit_windows(context)
    overtakes = await provider.predict_overtakes(context)
    winner = await provider.predict_winner(context)
    safety_car = await provider.assess_safety_car_risk(context)

    return PredictionsBundle(
        session_key=session_key,
        generated_by=provider.name,
        tyre_predictions=tyre_predictions,
        pit_windows=pit_windows,
        overtakes=overtakes,
        winner=winner,
        safety_car=safety_car,
    )


@router.get("/explain")
async def explain_race(session_key: Optional[int] = Query(None)):
    provider = get_ai_provider()
    context = await build_race_context(session_key)
    return await provider.explain_race(context)
