import { Radio } from "lucide-react";

import LiveLeaderboard from "../components/LiveLeaderboard";
import RaceTimeline from "../components/RaceTimeline";
import WeatherWidget from "../components/WeatherWidget";
import { useLatestSession, useLeaderboard, useRaceControl, useWeather, }
  from "../hooks/useRaceData";
import { useLiveRaceSocket } from "../hooks/useWebSocket";

export default function LiveRace() {
  const { data: session } = useLatestSession();
  const { data: leaderboard = [] } = useLeaderboard(
    session?.session_key
  );
  const { data: weather = [] } = useWeather(
    session?.session_key
  );
  const now = Date.now();

  const sessionStart = session?.date_start
    ? new Date(session.date_start).getTime()
    : 0;

  const sessionEnd = session?.date_end
    ? new Date(session.date_end).getTime()
    : 0;

  const isLive =
    sessionStart > 0 &&
    sessionEnd > 0 &&
    now >= sessionStart &&
    now <= sessionEnd;


  const liveSessionKey = isLive ? session?.session_key : undefined;

  const { snapshot, connectionState } =
    useLiveRaceSocket(liveSessionKey);

  const { data: raceControl = [] } =
    useRaceControl(liveSessionKey, isLive);
  const displayLeaderboard =
    snapshot?.leaderboard?.length
      ? snapshot.leaderboard
      : leaderboard;

  const displayWeather =
    snapshot?.weather || weather[weather.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Radio
          size={16}
          className={isLive
            ? connectionState === "open"
              ? "Live"
              : connectionState
            : "No live session"}
        />

        <span className="text-sm text-pit-muted">
          {isLive
            ? connectionState === "open"
              ? "Live"
              : connectionState
            : "No live session"}
        </span>

        {snapshot?.ai_provider && (
          <span className="badge bg-white/5 border border-pit-border text-pit-muted ml-2">
            AI: {snapshot.ai_provider.replace("_", " ")}
          </span>
        )}
      </div>

      {!isLive ? (
        <div className="glass-panel p-6">
          <p className="stat-label mb-2">Live Race</p>

          <h2 className="text-xl font-bold">
            <h2 className="text-xl font-bold">
              {isLive
                ? "F1 Live Race"
                : "No live F1 session is currently in progress."}
            </h2>
          </h2>

          {session && (
            <p className="text-sm text-pit-muted mt-2">
              Latest session: {session.session_name} ·{" "}
              {session.country_name}
            </p>
          )}

          <p className="text-sm text-pit-muted mt-1">
            Live leaderboard, weather and race-control data from the selected
            demo session are displayed here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-panel p-5">
              <p className="stat-label mb-3">Live Leaderboard</p>
              <LiveLeaderboard entries={displayLeaderboard} />
            </div>

            <div className="space-y-6">
              <WeatherWidget weather={displayWeather} />

              {snapshot?.safety_car && (
                <div className="glass-panel p-4">
                  <p className="stat-label mb-2">Safety Car Risk</p>

                  <p
                    className={`text-lg font-bold capitalize ${snapshot.safety_car.risk_level === "high"
                      ? "text-pit-red"
                      : snapshot.safety_car.risk_level === "medium"
                        ? "text-yellow-400"
                        : "text-emerald-400"
                      }`}
                  >
                    {snapshot.safety_car.risk_level} ·{" "}
                    {snapshot.safety_car.risk_pct}%
                  </p>

                  <p className="text-xs text-pit-muted mt-2">
                    {snapshot.safety_car.reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="stat-label mb-3">Race Control</p>
            <RaceTimeline messages={raceControl} />
          </div>
        </>
      )}
    </div>
  );
}