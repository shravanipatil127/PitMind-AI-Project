"""
RuleBasedAIProvider — a deterministic, no-API-key race intelligence engine.

Everything here runs on plain Python heuristics over live OpenF1 data:
lap times, stint/compound history, gaps between cars, and weather. It
requires no network access beyond OpenF1 itself and no LLM key.

This is registered as the default AIProvider. See provider.py for the
interface it implements and factory.py for how providers are selected.
"""

from __future__ import annotations

import statistics
from typing import Any, Dict, List, Optional

from app.models.schemas import (
    ChatMessage,
    ChatResponse,
    OvertakePrediction,
    PitWindowPrediction,
    RaceExplanation,
    SafetyCarRisk,
    TyreCompound,
    TyreWearPrediction,
    WinnerPrediction,
)
from app.services.ai.provider import AIProvider

# Rough, widely-cited compound life expectations (in laps) used purely as
# heuristics for the rule engine — not official Pirelli data.
COMPOUND_EXPECTED_LIFE = {
    TyreCompound.SOFT: 18,
    TyreCompound.MEDIUM: 28,
    TyreCompound.HARD: 40,
    TyreCompound.INTERMEDIATE: 25,
    TyreCompound.WET: 30,
    TyreCompound.UNKNOWN: 25,
}

OVERTAKE_GAP_THRESHOLD_SECONDS = 1.2
DRS_GAP_THRESHOLD_SECONDS = 1.0


def _safe_compound(raw: Optional[str]) -> TyreCompound:
    if not raw:
        return TyreCompound.UNKNOWN
    try:
        return TyreCompound(raw.upper())
    except ValueError:
        return TyreCompound.UNKNOWN


# ----------------------------------------------------------------------
# General Formula 1 knowledge — answered from built-in knowledge, never
# dependent on a live session. This is what fixes questions like
# "What is DRS?" or "Explain undercut." being misrouted into the
# live-data strategy handlers below.
# ----------------------------------------------------------------------

IDENTITY_RESPONSE = (
    "I'm PitMind AI, a Formula 1 race engineer assistant. I can explain F1 rules, "
    "terms, and strategy concepts from general knowledge at any time, and — when a "
    "live session is available — analyze real-time tyre wear, pit windows, overtake "
    "likelihood, win probability, and safety car risk using live OpenF1 data."
)

_GREETING_WORDS = {"hi", "hello", "hey", "yo", "sup", "hiya"}

_IDENTITY_PHRASES = (
    "who are you",
    "what are you",
    "your name",
    "what can you do",
    "how do you work",
    "introduce yourself",
    "what is pitmind",
)

_EXPLAIN_INTENT_PHRASES = (
    "what is",
    "what's",
    "whats",
    "explain",
    "define",
    "definition",
    "meaning of",
    "how does",
    "how do",
    "tell me about",
)

# Each entry: (keywords, explanation, ambiguous).
# `ambiguous=True` marks terms whose keywords overlap with the live-data
# strategy handlers below (e.g. "safety car", "pit stop"). For those, a
# glossary answer is only given when the question reads as a definition
# request AND has no live-race cues ("now", "risk", "current", …) —
# otherwise it falls through to the live-data handler, where it belongs.
# Non-ambiguous terms (DRS, undercut, tyre compounds, flags, etc.) are
# always answered directly since nothing else in the app handles them.
F1_GLOSSARY: List[tuple] = [
    (
        ("drs", "drag reduction"),
        "DRS (Drag Reduction System) lets a driver open a flap in the rear wing to cut "
        "drag and gain top speed. It activates when a driver is within one second of the "
        "car ahead at a detection point, inside a marked DRS zone — but not during the "
        "first two laps, behind a safety car, or in wet conditions.",
        False,
    ),
    (
        ("undercut",),
        "The undercut is a strategy where a driver pits earlier than a rival, fits fresh "
        "tyres, and uses the pace advantage of new rubber to build enough of a gap that "
        "they come out ahead once the rival makes their own, later stop.",
        False,
    ),
    (
        ("overcut",),
        "The overcut is the opposite of the undercut: a driver stays out longer on older "
        "tyres while a rival pits, banking lap time on a clear track, hoping that gap plus "
        "the rival's cold out-lap is enough to emerge ahead after their own later stop.",
        False,
    ),
    (
        (
            "tyre compound",
            "tire compound",
            "tyre types",
            "tire types",
            "types of tyre",
            "types of tire",
        ),
        "Pirelli supplies five slick compounds (C1 hardest to C5 softest) branded as hard "
        "(white), medium (yellow), and soft (red) for a race weekend, plus intermediate "
        "(green) and full wet (blue) tyres for damp or rainy conditions. Softer compounds "
        "give more grip and faster laps but wear out sooner; harder compounds last longer "
        "with less peak grip.",
        False,
    ),
    (
        ("virtual safety car", "vsc"),
        "The Virtual Safety Car (VSC) requires every driver to stay within a delta time and "
        "not overtake. It's used for less severe incidents than a full Safety Car, "
        "neutralizing the race without bunching the field up behind a physical car.",
        False,
    ),
    (
        ("safety car",),
        "A Safety Car is deployed to slow the field behind a pace car after a serious "
        "incident, closing up the gaps between cars. Because the time lost pitting is much "
        "smaller under caution, it often triggers a wave of pit stops.",
        True,
    ),
    (
        ("red flag",),
        "A red flag stops a session entirely — usually for a serious incident, extreme "
        "weather, or an unsafe track — and cars return to the pit lane or grid to await a "
        "restart.",
        False,
    ),
    (
        ("yellow flag",),
        "A yellow flag warns of a hazard ahead: drivers must slow down and overtaking is "
        "banned in that sector until they see a green flag or an 'all clear'.",
        False,
    ),
    (
        ("blue flag",),
        "A blue flag is shown to a driver who's about to be lapped, signalling them to let "
        "the faster car behind pass.",
        False,
    ),
    (
        ("dnf",),
        "DNF means 'Did Not Finish' — the car retired from the race due to a crash, "
        "mechanical failure, or other issue before completing the full race distance.",
        False,
    ),
    (
        ("grid penalty",),
        "A grid penalty moves a driver back a set number of positions on the starting grid "
        "— usually issued for causing a collision, exceeding component allocations like "
        "engines or gearboxes, or other rules infringements.",
        False,
    ),
    (
        ("sprint race", "sprint format", "what is a sprint"),
        "A Sprint is a shorter, standalone race (about 100km, no mandatory pit stop) held "
        "on Saturday at select rounds. It sets the grid for Sunday's Grand Prix and awards "
        "points to the top eight finishers.",
        False,
    ),
    (
        ("points system", "how do points work", "championship points"),
        "Points go to the top 10 finishers in the Grand Prix: 25-18-15-12-10-8-6-4-2-1, "
        "plus one bonus point for the fastest lap if that driver finishes in the top 10. "
        "Sprint races award points to the top eight (8-7-6-5-4-3-2-1).",
        False,
    ),
    (
        ("parc ferme",),
        "Parc fermé is a strict regulatory period, from qualifying until after the race, "
        "during which teams can't make significant setup changes to the car without "
        "incurring a grid penalty.",
        False,
    ),
    (
        ("track limits",),
        "Track limits require at least part of the car to stay within the white lines "
        "defining the circuit. Repeatedly running wide and gaining an advantage can result "
        "in a lap time being deleted or a time penalty.",
        False,
    ),
    (
        ("formation lap", "warm up lap", "warm-up lap"),
        "The formation lap is a slow lap before the race start where drivers line up on "
        "the grid in position, warming their tyres and brakes.",
        False,
    ),
    (
        ("pit stop", "pitstop"),
        "A pit stop is when a car comes into the pit lane to change tyres (and sometimes "
        "make repairs). Modern F1 pit crews can change all four tyres in around 2–3 "
        "seconds.",
        True,
    ),
]

# General, non-live-data strategic advice used when a strategy question is
# asked but no live session data is available yet.
GENERAL_STRATEGY_ADVICE = {
    "pit": (
        "In general, teams plan pit windows around tyre degradation curves, the threat of "
        "an undercut or overcut from rivals, and the value of track position — typically "
        "aiming to pit just before a tyre's performance drops off a cliff, while staying "
        "close enough to cover rivals within pit-stop range."
    ),
    "tyre": (
        "Generally, soft compounds are fastest but degrade quickest (roughly 15-20 laps), "
        "mediums balance pace and durability (around 25-30 laps), and hards last longest "
        "with less outright grip. Actual degradation depends heavily on track abrasiveness, "
        "temperature, and car setup."
    ),
    "winner": (
        "Without live data I can't calculate a real win probability, but generally the "
        "favorite combines strong qualifying pace, tyre strategy flexibility, and a good "
        "starting track position."
    ),
    "safety_car": (
        "Historically, safety car probability rises on street circuits, in the opening "
        "laps when the field is bunched up, and in wet or mixed conditions."
    ),
    "overtake": (
        "General overtaking analysis comes down to DRS zones, straight-line speed "
        "differential, tyre age gap between the cars, and the braking-zone characteristics "
        "of the circuit."
    ),
}


def _contains_any(text: str, phrases: tuple) -> bool:
    return any(phrase in text for phrase in phrases)


class RuleBasedAIProvider(AIProvider):
    name = "rule_based"

    # ------------------------------------------------------------------
    # Tyre wear
    # ------------------------------------------------------------------
    async def predict_tyre_wear(
        self, race_context: Dict[str, Any]
    ) -> List[TyreWearPrediction]:
        stints = race_context.get("stints", [])
        laps = race_context.get("laps", [])
        predictions: List[TyreWearPrediction] = []

        latest_stint_by_driver: Dict[int, Dict[str, Any]] = {}
        for stint in stints:
            driver = stint.get("driver_number")
            if driver is None:
                continue
            existing = latest_stint_by_driver.get(driver)
            if not existing or (stint.get("stint_number") or 0) >= (
                existing.get("stint_number") or 0
            ):
                latest_stint_by_driver[driver] = stint

        current_lap_by_driver = self._latest_lap_number_by_driver(laps)

        for driver, stint in latest_stint_by_driver.items():
            compound = _safe_compound(stint.get("compound"))
            lap_start = stint.get("lap_start") or 1
            current_lap = current_lap_by_driver.get(driver, lap_start)
            age = max(0, current_lap - lap_start)

            expected_life = COMPOUND_EXPECTED_LIFE.get(compound, 25)
            wear_pct = (
                min(100.0, round((age / expected_life) * 100, 1))
                if expected_life
                else 0.0
            )

            driver_laps = self._recent_lap_times(laps, driver, count=5)
            trend = self._degradation_trend(driver_laps)

            confidence = 0.85 if len(driver_laps) >= 3 else 0.55

            predictions.append(
                TyreWearPrediction(
                    driver_number=driver,
                    compound=compound,
                    estimated_age_laps=age,
                    estimated_wear_pct=wear_pct,
                    degradation_trend=trend,
                    confidence=confidence,
                )
            )

        return sorted(predictions, key=lambda p: p.estimated_wear_pct, reverse=True)

    # ------------------------------------------------------------------
    # Pit windows
    # ------------------------------------------------------------------
    async def predict_pit_windows(
        self, race_context: Dict[str, Any]
    ) -> List[PitWindowPrediction]:
        tyre_predictions = await self.predict_tyre_wear(race_context)
        windows: List[PitWindowPrediction] = []

        for tp in tyre_predictions:
            expected_life = COMPOUND_EXPECTED_LIFE.get(tp.compound, 25)
            laps_remaining_on_tyre = max(0, expected_life - tp.estimated_age_laps)

            earliest = max(1, laps_remaining_on_tyre - 4)
            latest = max(earliest + 1, laps_remaining_on_tyre + 3)

            if tp.estimated_wear_pct >= 85:
                reasoning = (
                    f"{tp.compound.value.title()} tyres are at {tp.estimated_wear_pct}% "
                    "estimated wear — pit soon to avoid a cliff in pace."
                )
            elif tp.degradation_trend == "worsening":
                reasoning = (
                    f"Lap times are trending slower on {tp.compound.value.title()} tyres, "
                    "suggesting degradation is accelerating."
                )
            else:
                reasoning = (
                    f"{tp.compound.value.title()} tyres are wearing predictably; "
                    "window opens as they approach expected compound life."
                )

            windows.append(
                PitWindowPrediction(
                    driver_number=tp.driver_number,
                    recommended_lap_earliest=int(earliest),
                    recommended_lap_latest=int(latest),
                    reasoning=reasoning,
                    confidence=tp.confidence,
                )
            )

        return windows

    # ------------------------------------------------------------------
    # Overtakes
    # ------------------------------------------------------------------
    async def predict_overtakes(
        self, race_context: Dict[str, Any]
    ) -> List[OvertakePrediction]:
        intervals = race_context.get("intervals", [])
        positions = race_context.get("positions", [])
        predictions: List[OvertakePrediction] = []

        latest_by_driver = self._latest_by_driver(intervals)
        ordered_positions = sorted(
            self._latest_by_driver(positions).values(),
            key=lambda p: p.get("position", 999),
        )

        for idx in range(1, len(ordered_positions)):
            defender = ordered_positions[idx - 1]
            attacker = ordered_positions[idx]
            attacker_number = attacker.get("driver_number")
            defender_number = defender.get("driver_number")
            if attacker_number is None or defender_number is None:
                continue

            gap_entry = latest_by_driver.get(attacker_number, {})
            gap = gap_entry.get("interval") or gap_entry.get("gap_to_leader")

            if gap is None:
                continue

            try:
                gap_val = float(gap)
            except (TypeError, ValueError):
                continue

            if gap_val <= DRS_GAP_THRESHOLD_SECONDS:
                likelihood = 75.0
                reasoning = f"Within DRS range ({gap_val:.2f}s) — high overtake likelihood on the next straight."
            elif gap_val <= OVERTAKE_GAP_THRESHOLD_SECONDS:
                likelihood = 45.0
                reasoning = f"Close gap ({gap_val:.2f}s) — a pressure move is plausible within a few laps."
            else:
                likelihood = max(5.0, 30.0 - gap_val * 3)
                reasoning = f"Gap of {gap_val:.2f}s is currently too large for a clean overtake."

            predictions.append(
                OvertakePrediction(
                    attacker_driver_number=attacker_number,
                    defender_driver_number=defender_number,
                    gap_seconds=gap_val,
                    likelihood_pct=round(likelihood, 1),
                    reasoning=reasoning,
                )
            )

        return predictions

    # ------------------------------------------------------------------
    # Winner prediction
    # ------------------------------------------------------------------
    async def predict_winner(
        self, race_context: Dict[str, Any]
    ) -> List[WinnerPrediction]:
        positions = race_context.get("positions", [])
        laps = race_context.get("laps", [])
        latest_positions = sorted(
            self._latest_by_driver(positions).values(),
            key=lambda p: p.get("position", 999),
        )

        if not latest_positions:
            return []

        pace_by_driver = self._average_pace_by_driver(laps)
        if pace_by_driver:
            best_pace = min(pace_by_driver.values())
        else:
            best_pace = None

        raw_scores: Dict[int, float] = {}
        for entry in latest_positions:
            driver = entry.get("driver_number")
            if driver is None:
                continue
            position = entry.get("position", 20)
            position_score = max(0.0, 21 - position)

            pace_score = 0.0
            if best_pace and driver in pace_by_driver and pace_by_driver[driver] > 0:
                pace_score = (best_pace / pace_by_driver[driver]) * 10

            raw_scores[driver] = position_score * 2 + pace_score

        total = sum(raw_scores.values()) or 1.0
        results = [
            WinnerPrediction(
                driver_number=driver,
                win_probability_pct=round((score / total) * 100, 1),
                reasoning=(
                    "Ranked using current track position weighted heavily, "
                    "adjusted by recent average lap pace."
                ),
            )
            for driver, score in raw_scores.items()
        ]

        return sorted(results, key=lambda r: r.win_probability_pct, reverse=True)[:10]

    # ------------------------------------------------------------------
    # Safety car risk
    # ------------------------------------------------------------------
    async def assess_safety_car_risk(
        self, race_context: Dict[str, Any]
    ) -> SafetyCarRisk:
        race_control = race_context.get("race_control", [])
        weather = race_context.get("weather", [])

        recent_incidents = [
            m
            for m in race_control
            if (m.get("category") or "").lower() in ("flag", "safetycar", "drs")
            or "incident" in (m.get("message") or "").lower()
        ]

        rainfall = 0.0
        if weather:
            latest_weather = weather[-1]
            try:
                rainfall = float(latest_weather.get("rainfall") or 0)
            except (TypeError, ValueError):
                rainfall = 0.0

        risk_pct = min(95.0, 10.0 + len(recent_incidents) * 12 + (rainfall * 40))

        if risk_pct >= 60:
            level = "high"
            reasoning = "Multiple recent incident/flag messages and/or wet conditions raise safety car risk."
        elif risk_pct >= 30:
            level = "medium"
            reasoning = (
                "Some incident activity on track; conditions are moderately unsettled."
            )
        else:
            level = "low"
            reasoning = "Track conditions and race control messages suggest a stable, low-risk session."

        return SafetyCarRisk(
            risk_level=level, risk_pct=round(risk_pct, 1), reasoning=reasoning
        )

    # ------------------------------------------------------------------
    # Race explanation
    # ------------------------------------------------------------------
    async def explain_race(self, race_context: Dict[str, Any]) -> RaceExplanation:
        positions = sorted(
            self._latest_by_driver(race_context.get("positions", [])).values(),
            key=lambda p: p.get("position", 999),
        )
        winner_predictions = await self.predict_winner(race_context)
        safety_car = await self.assess_safety_car_risk(race_context)
        pit_windows = await self.predict_pit_windows(race_context)

        leader = positions[0]["driver_number"] if positions else None
        headline = (
            f"Driver #{leader} currently leads the session."
            if leader is not None
            else "There's no live race session in progress right now."
        )

        key_factors: List[str] = []
        if winner_predictions:
            top = winner_predictions[0]
            key_factors.append(
                f"Driver #{top.driver_number} holds the highest modeled win probability "
                f"at {top.win_probability_pct}%."
            )
        if safety_car.risk_level != "low":
            key_factors.append(
                f"Safety car risk is currently {safety_car.risk_level} "
                f"({safety_car.risk_pct}%): {safety_car.reasoning}"
            )
        if pit_windows:
            soonest = min(pit_windows, key=lambda w: w.recommended_lap_earliest)
            key_factors.append(
                f"Driver #{soonest.driver_number} has the earliest recommended pit window, "
                f"opening around lap {soonest.recommended_lap_earliest}."
            )

        narrative_parts = [headline]
        narrative_parts.extend(key_factors)
        if not key_factors:
            narrative_parts.append(
                "Insufficient live data to generate detailed strategic factors yet."
            )

        narrative = " ".join(narrative_parts)

        return RaceExplanation(
            headline=headline,
            narrative=narrative,
            key_factors=key_factors,
            generated_by=self.name,
        )

    # ------------------------------------------------------------------
    # Chat
    # ------------------------------------------------------------------
    async def chat(
        self, messages: List[ChatMessage], race_context: Dict[str, Any]
    ) -> ChatResponse:
        last_user_message = ""
        for m in reversed(messages):
            if m.role == "user":
                last_user_message = m.content.strip()
                break

        text = last_user_message.lower().strip(" ?.!")

        default_suggestions = [
            "What's the pit window for the race leader?",
            "How much tyre wear does the leader have?",
            "What's the safety car risk right now?",
            "Explain the undercut.",
        ]

        # 1. Identity / greeting — always answered locally, never touches
        #    live data or the strategy handlers below.
        if text in _GREETING_WORDS or _contains_any(text, _IDENTITY_PHRASES):
            return ChatResponse(
                reply=IDENTITY_RESPONSE,
                generated_by=self.name,
                suggestions=default_suggestions,
            )

        # 2. General Formula 1 knowledge — glossary lookups always answer
        #    from built-in knowledge, regardless of whether a live session
        #    exists. This is what makes "What is DRS?" or "Explain
        #    undercut." work with no live race in progress.
        has_explain_intent = _contains_any(text, _EXPLAIN_INTENT_PHRASES)
        glossary_match = self._match_glossary(text)
        if glossary_match:
            glossary_reply, ambiguous = glossary_match
            # Non-ambiguous terms (DRS, undercut, tyre compounds, flags…)
            # never collide with a live-data handler, so always answer them
            # directly. Ambiguous terms ("safety car", "pit stop") only get
            # the glossary answer when the question clearly reads as a
            # definition request with no live-race cues — otherwise they
            # fall through to the live-data strategy handlers below, where
            # they belong.
            if not ambiguous or (
                has_explain_intent and not self._is_strategy_query(text)
            ):
                return ChatResponse(
                    reply=glossary_reply,
                    generated_by=self.name,
                    suggestions=default_suggestions,
                )

        has_live_data = self._has_live_data(race_context)
        # 3. Current race leader
        if _contains_any(
            text,
            (
                "who is leading",
                "who's leading",
                "whos leading",
                "who leads",
                "current leader",
                "race leader",
            ),
        ):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, "
                    "so there isn't a current race leader to report."
                )
            else:
                positions = race_context.get("positions", [])
                latest_positions = sorted(
                    self._latest_by_driver(positions).values(),
                    key=lambda p: p.get("position", 999),
                )

                if latest_positions:
                    leader = latest_positions[0]
                    driver_number = leader.get("driver_number")

                    reply = f"The current race leader is driver #{driver_number} (P1)."
                else:
                    reply = (
                        "The race is live, but I don't have enough current "
                        "position data to identify the leader yet."
                    )

            return ChatResponse(
                reply=reply,
                generated_by=self.name,
                suggestions=default_suggestions,
            )

        # 3. Strategy questions — use live OpenF1 data when available, and
        #    gracefully explain when it isn't while still giving general
        #    strategic advice on the topic.
        if _contains_any(text, ("pit", "stop", "window")):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, so I can't pull "
                    f"real pit stop data. {GENERAL_STRATEGY_ADVICE['pit']}"
                )
            else:
                windows = await self.predict_pit_windows(race_context)
                if windows:
                    w = windows[0]
                    reply = (
                        f"For driver #{w.driver_number}, I'd target a pit window between "
                        f"lap {w.recommended_lap_earliest} and lap {w.recommended_lap_latest}. "
                        f"{w.reasoning}"
                    )
                else:
                    reply = (
                        "I don't have enough live stint data yet to recommend a pit window. "
                        f"{GENERAL_STRATEGY_ADVICE['pit']}"
                    )
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        if _contains_any(text, ("tyre", "tire", "wear", "degrad", "stint")):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, so I don't have "
                    f"real tyre wear data. {GENERAL_STRATEGY_ADVICE['tyre']}"
                )
            else:
                tyres = await self.predict_tyre_wear(race_context)
                if tyres:
                    t = tyres[0]
                    reply = (
                        f"Driver #{t.driver_number} is on {t.compound.value.title()} tyres at "
                        f"roughly {t.estimated_wear_pct}% estimated wear, trending "
                        f"{t.degradation_trend}."
                    )
                else:
                    reply = (
                        "No tyre stint data is currently available. "
                        f"{GENERAL_STRATEGY_ADVICE['tyre']}"
                    )
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        if _contains_any(text, ("win", "winner", "favourite", "favorite")):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, so I can't compute a "
                    f"real win probability. {GENERAL_STRATEGY_ADVICE['winner']}"
                )
            else:
                winners = await self.predict_winner(race_context)
                if winners:
                    top = winners[0]
                    reply = (
                        f"Right now driver #{top.driver_number} has the highest modeled win "
                        f"probability at {top.win_probability_pct}%. {top.reasoning}"
                    )
                else:
                    reply = (
                        "There isn't enough position data yet to estimate a winner. "
                        f"{GENERAL_STRATEGY_ADVICE['winner']}"
                    )
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        if _contains_any(text, ("safety car", "vsc", "crash", "incident")):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, so I can't assess "
                    f"real-time safety car risk. {GENERAL_STRATEGY_ADVICE['safety_car']}"
                )
            else:
                sc = await self.assess_safety_car_risk(race_context)
                reply = f"Safety car risk is currently {sc.risk_level} ({sc.risk_pct}%). {sc.reasoning}"
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        if _contains_any(text, ("overtake", "pass", "battle")):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now, so I don't have real "
                    f"gap data. {GENERAL_STRATEGY_ADVICE['overtake']}"
                )
            else:
                overtakes = await self.predict_overtakes(race_context)
                if overtakes:
                    o = overtakes[0]
                    reply = (
                        f"Driver #{o.attacker_driver_number} is {o.gap_seconds:.2f}s behind "
                        f"driver #{o.defender_driver_number} with a {o.likelihood_pct}% modeled "
                        f"overtake likelihood. {o.reasoning}"
                    )
                else:
                    reply = (
                        "No close battles are currently detected in the live interval data. "
                        f"{GENERAL_STRATEGY_ADVICE['overtake']}"
                    )
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        # 4. Explicit request for a race summary/status.
        if _contains_any(
            text,
            (
                "race state",
                "what's happening",
                "whats happening",
                "race summary",
                "how's the race",
                "hows the race",
            ),
        ):
            if not has_live_data:
                reply = (
                    "There's no live race session in progress right now — once one starts, "
                    "I can walk you through the leader, tyre strategies, and safety car risk "
                    "in real time."
                )
            else:
                explanation = await self.explain_race(race_context)
                reply = explanation.narrative
            return ChatResponse(
                reply=reply, generated_by=self.name, suggestions=default_suggestions
            )

        # 5. Fallback — nothing matched. Give a helpful capabilities
        #    summary rather than an error about missing live data.
        reply = (
            "I can help with Formula 1 rules and terminology anytime, and with live race "
            "strategy — tyres, pit windows, overtakes, safety car risk, win probability — "
            "whenever a session is active. Try asking something like 'Explain DRS' or "
            "'What's the pit window for the leader?'"
        )
        return ChatResponse(
            reply=reply, generated_by=self.name, suggestions=default_suggestions
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _match_glossary(text: str) -> Optional[tuple]:
        """Look up general F1 knowledge. Returns (answer, ambiguous) or None.
        `ambiguous` terms (e.g. "safety car", "pit stop") also overlap with
        the live-data strategy handlers and need extra disambiguation by
        the caller before being used."""
        for keywords, answer, ambiguous in F1_GLOSSARY:
            if _contains_any(text, keywords):
                return answer, ambiguous
        return None

    @staticmethod
    def _is_strategy_query(text: str) -> bool:
        """True if the message is asking about the CURRENT/live race rather
        than a general definition, used to disambiguate terms like
        'safety car' or 'pit stop' that appear in both the glossary and
        the live-data handlers."""
        live_cues = (
            "current",
            "currently",
            "now",
            "right now",
            "live",
            "my",
            "our",
            "leader",
            "risk",
            "chance",
            "likelihood",
            "probability",
            "today",
        )
        return _contains_any(text, live_cues) or any(ch.isdigit() for ch in text)

    @staticmethod
    def _has_live_data(race_context: Dict[str, Any]) -> bool:
        """True only when the race context belongs to an active session."""
        return bool(race_context.get("is_live"))

    @staticmethod
    def _latest_by_driver(entries: List[Dict[str, Any]]) -> Dict[int, Dict[str, Any]]:
        latest: Dict[int, Dict[str, Any]] = {}
        for entry in entries:
            driver = entry.get("driver_number")
            if driver is None:
                continue
            existing = latest.get(driver)
            if not existing or (entry.get("date") or "") >= (
                existing.get("date") or ""
            ):
                latest[driver] = entry
        return latest

    @staticmethod
    def _latest_lap_number_by_driver(laps: List[Dict[str, Any]]) -> Dict[int, int]:
        latest: Dict[int, int] = {}
        for lap in laps:
            driver = lap.get("driver_number")
            lap_number = lap.get("lap_number")
            if driver is None or lap_number is None:
                continue
            if driver not in latest or lap_number > latest[driver]:
                latest[driver] = lap_number
        return latest

    @staticmethod
    def _recent_lap_times(
        laps: List[Dict[str, Any]], driver_number: int, count: int = 5
    ) -> List[float]:
        driver_laps = [
            lap
            for lap in laps
            if lap.get("driver_number") == driver_number and lap.get("lap_duration")
        ]
        driver_laps.sort(key=lambda l: l.get("lap_number") or 0)
        durations = [float(l["lap_duration"]) for l in driver_laps[-count:]]
        return durations

    @staticmethod
    def _degradation_trend(recent_lap_times: List[float]) -> str:
        if len(recent_lap_times) < 3:
            return "unknown"
        first_half = recent_lap_times[: len(recent_lap_times) // 2]
        second_half = recent_lap_times[len(recent_lap_times) // 2 :]
        if not first_half or not second_half:
            return "unknown"
        delta = statistics.mean(second_half) - statistics.mean(first_half)
        if delta > 0.15:
            return "worsening"
        if delta < -0.15:
            return "improving"
        return "stable"

    @staticmethod
    def _average_pace_by_driver(laps: List[Dict[str, Any]]) -> Dict[int, float]:
        by_driver: Dict[int, List[float]] = {}
        for lap in laps:
            driver = lap.get("driver_number")
            duration = lap.get("lap_duration")
            if driver is None or not duration:
                continue
            by_driver.setdefault(driver, []).append(float(duration))
        return {
            driver: statistics.mean(times)
            for driver, times in by_driver.items()
            if times
        }
