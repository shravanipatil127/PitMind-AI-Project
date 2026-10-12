import { useQuery } from "@tanstack/react-query";
import { Wrench } from "lucide-react";

import { api } from "../api/client";
import ErrorScreen from "../components/ErrorScreen";
import { CardSkeleton } from "../components/LoadingSkeleton";
import {
  useLatestSession,
  usePredictions,
} from "../hooks/useRaceData";
import type { RaceExplanation } from "../types";

export default function RaceEngineer() {
  const { data: session } = useLatestSession();

  // Check whether the latest session is actually running right now.
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

  const { data: predictions } = usePredictions(
    session?.session_key,
    isLive
  );

  const {
    data: explanation,
    isLoading,
    isError,
    refetch,
  } = useQuery<RaceExplanation>({
    queryKey: ["explain", session?.session_key],

    queryFn: () =>
      api.explainRace(
        session?.session_key
      ) as Promise<RaceExplanation>,

    enabled: isLive && !!session?.session_key,

    refetchInterval: isLive ? 15_000 : false,
  });

  return (
    <div className="space-y-6">

      {/* Session status */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isLive
              ? "bg-emerald-400 animate-pulse"
              : "bg-pit-muted"
              }`}
          />

          <div>
            <p className="text-sm font-semibold">
              {isLive
                ? "LIVE RACE ENGINEER"
                : "NO LIVE SESSION"}
            </p>

            <p className="text-xs text-pit-muted mt-1">
              {isLive
                ? `${session?.session_name || "F1 session"} · ${session?.country_name ||
                ""
                }`
                : session
                  ? `Latest completed session: ${session.session_name || "Session"
                  } · ${session.country_name ||
                  session.location ||
                  ""
                  }`
                  : "No F1 session data available."}
            </p>
          </div>
        </div>
      </div>

      {/* No live session */}
      {!isLive && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench
              size={18}
              className="text-pit-red"
            />

            <p className="stat-label">
              Race Engineer Briefing
            </p>

            <span className="badge bg-white/5 border border-pit-border text-pit-muted ml-auto">
              Waiting for live session
            </span>
          </div>

          <p className="text-xl font-bold mb-3">
            No live F1 session is currently in progress.
          </p>

          <p className="text-pit-muted leading-relaxed">
            The race engineer briefing, key factors and
            pit-window recommendations will appear here
            when an active F1 session is available.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLive && isLoading && (
        <CardSkeleton />
      )}

      {/* Error */}
      {isLive && isError && (
        <ErrorScreen onRetry={() => refetch()} />
      )}

      {/* Live Race Engineer */}
      {isLive && explanation && (
        <>
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wrench
                size={18}
                className="text-pit-red"
              />

              <p className="stat-label">
                Race Engineer Briefing
              </p>

              <span className="badge bg-white/5 border border-pit-border text-pit-muted ml-auto">
                {explanation.generated_by.replace(
                  "_",
                  " "
                )}
              </span>
            </div>

            <p className="text-xl font-bold mb-3">
              {explanation.headline}
            </p>

            <p className="text-pit-muted leading-relaxed">
              {explanation.narrative}
            </p>
          </div>

          {explanation.key_factors.length > 0 && (
            <div className="glass-panel p-6">
              <p className="stat-label mb-3">
                Key Factors
              </p>

              <ul className="space-y-2">
                {explanation.key_factors.map(
                  (factor, idx) => (
                    <li
                      key={idx}
                      className="text-sm flex gap-2"
                    >
                      <span className="text-pit-red">
                        •
                      </span>

                      {factor}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {predictions?.pit_windows &&
            predictions.pit_windows.length > 0 && (
              <div className="glass-panel p-6">
                <p className="stat-label mb-3">
                  Recommended Pit Windows
                </p>

                <div className="space-y-2">
                  {predictions.pit_windows
                    .slice(0, 5)
                    .map((w) => (
                      <div
                        key={w.driver_number}
                        className="flex items-center justify-between text-sm py-2 border-b border-pit-border/50 last:border-0"
                      >
                        <span>
                          Driver #{w.driver_number}
                        </span>

                        <span className="text-pit-muted">
                          Lap{" "}
                          {w.recommended_lap_earliest}–
                          {w.recommended_lap_latest}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}