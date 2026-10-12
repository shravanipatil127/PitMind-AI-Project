# 🏎️ PitMind AI — Intelligent Formula 1 Race Engineer

PitMind AI is a Formula 1 race intelligence dashboard that combines
OpenF1 race data with a Python/FastAPI backend and React/TypeScript frontend.

It provides live-session analysis, historical race replay, telemetry
visualization, tyre strategy insights, pit-window recommendations,
overtake analysis, safety-car risk assessment, win-probability modeling,
and an AI race-engineer-style chat interface.

The default intelligence engine is a deterministic rule-based system,
so the project can run without an external LLM API key.

---

## ✨ Features

### 📊 Dashboard
- Session status detection
- Latest session information
- Track conditions
- Driver leaderboard
- Live-session awareness

### 🏁 Live Race
- Live race session detection
- Race-control updates
- Live race information through OpenF1
- Prevents completed historical sessions from being displayed as live

### 👨‍✈️ Drivers
- Driver information
- Current/latest session driver data
- Team information

### 🏎️ Teams
- Team grouping
- Driver/team information from session data

### 📈 Telemetry
- Speed data
- RPM data
- Live telemetry visualization
- Telemetry is enabled only during an active session

### 🧠 Strategy
- Tyre wear estimation
- Pit-window recommendations
- Race strategy analysis
- Live-session protection

### 🔮 Predictions
- Modeled win probability
- Overtake likelihood
- Safety-car risk
- Strategy-related predictions

> Predictions are heuristic/model-based estimates and should not be
> interpreted as official F1 predictions.

### 🤖 AI Chat
The race-engineer chat can answer:

- F1 terminology questions
- Tyre strategy questions
- Pit-window questions
- Overtaking questions
- Safety-car questions
- Race-status questions
- Current race leader during an active session

The chat distinguishes between live and historical data so that
completed races are not presented as current race information.

### 📼 Historical Replay
- Select a season/year
- Select an individual F1 session
- View historical weather
- View historical lap data
- Replay data from the selected OpenF1 session

### ⚙️ Settings
- Rule-based AI provider
- Optional OpenAI-compatible LLM provider
- Backend connection information

---

## 🏗️ Architecture

```text
┌─────────────────────┐
│   React Frontend    │
│  Vite + TypeScript  │
└──────────┬──────────┘
           │
           │ REST + WebSocket
           ▼
┌─────────────────────┐
│   FastAPI Backend   │
│       Python        │
└──────────┬──────────┘
           │
           ├──────────────────────┐
           │                      │
           ▼                      ▼
┌─────────────────────┐   ┌──────────────────────┐
│    OpenF1 API       │   │    AI Provider       │
│ Race / Telemetry    │   │                      │
│ Weather / Sessions  │   │ Rule-Based (default) │
└─────────────────────┘   │ OpenAI-Compatible    │
                          │ (optional)            │
                          └──────────────────────┘