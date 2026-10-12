import { Brain, Clock } from "lucide-react";

import ErrorScreen from "../components/ErrorScreen";
import { GridSkeleton } from "../components/LoadingSkeleton";
import PredictionCard from "../components/PredictionCard";
import RaceTimeline from "../components/RaceTimeline";
import TrackStatus from "../components/TrackStatus";
import TyreCard from "../components/TyreCard";
import {
  useLatestSession,
  usePredictions,
  useRaceControl,
} from "../hooks/useRaceData";

export default function Strategy() {
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

  const {
    data: predictions,
    isLoading,
    isError,
    refetch,
  } = usePredictions(session?.session_key, isLive);

  const { data: raceControl = [] } = useRaceControl(
    session?.session_key,
    isLive
  );

  return (
    <div className="space-y-8">
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
              {isLive ? "LIVE STRATEGY" : "NO LIVE SESSION"}
            </p>

            <p className="text-xs text-pit-muted mt-1">
              {isLive
                ? `${session?.session_name || "F1 session"} · ${session?.country_name || ""
                }`
                : session
                  ? `Latest completed session: ${session.session_name || "Session"
                  } · ${session.country_name || session.location || ""
                  }`
                  : "No F1 session data available."}
            </p>
          </div>
        </div>
      </div>

      {/* Strategy overview when no session is live */}
      {!isLive && (
        <div className="space-y-6">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain size={22} className="text-pit-red" />
              <div>
                <p className="stat-label mb-1">
                  RACE STRATEGY
                </p>
                <h2 className="text-2xl font-bold">
                  Plan the Perfect Pit Stop
                </h2>
              </div>
            </div>

            <p className="text-pit-muted leading-relaxed">
              Explore tyre strategy, pit-stop timing and race-control
              conditions. Live recommendations will appear when an
              active F1 session and the required race data are available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5">
              <Clock size={20} className="text-pit-red mb-3" />
              <h3 className="font-semibold mb-2">
                Pit-Stop Timing
              </h3>
              <p className="text-sm text-pit-muted">
                Review recommended pit windows and potential
                undercut or overcut opportunities when data is available.
              </p>
            </div>

            <div className="glass-panel p-5">
              <Brain size={20} className="text-pit-red mb-3" />
              <h3 className="font-semibold mb-2">
                Tyre Strategy
              </h3>
              <p className="text-sm text-pit-muted">
                Review tyre wear, stint information and possible
                compound strategies using available race data.
              </p>
            </div>
          </div>

          <div className="glass-panel p-5">
            <p className="stat-label mb-2">
              RACE CONTROL
            </p>
            <h3 className="font-semibold mb-2">
              Safety Car and Track Conditions
            </h3>
            <p className="text-sm text-pit-muted">
              Track status and race-control messages help explain
              when a strategy adjustment may be needed.
            </p>
          </div>
        </div>
      )}

      {/* Live strategy loading */}
      {isLive && isLoading && (
        <GridSkeleton count={6} />
      )}

      {/* Live strategy error */}
      {isLive && isError && (
        <ErrorScreen onRetry={() => refetch()} />
      )}

      {/* Live strategy data */}
      {isLive && predictions && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TrackStatus
              session={session}
              safetyCar={predictions.safety_car}
            />

            <div className="lg:col-span-2 glass-panel p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={16} className="text-pit-red" />

                <p className="stat-label">
                  AI Strategy Recommendations
                </p>

                <span className="badge bg-white/5 border border-pit-border text-pit-muted ml-auto">
                  {predictions.generated_by.replace("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predictions.pit_windows
                  .slice(0, 4)
                  .map((w) => (
                    <PredictionCard
                      key={w.driver_number}
                      title={`Driver #${w.driver_number}`}
                      icon={
                        <Clock size={14} className="text-pit-red" />
                      }
                      confidence={w.confidence}
                    >
                      <p className="mb-1">
                        Target lap {w.recommended_lap_earliest}–
                        {w.recommended_lap_latest}
                      </p>
                      <p>{w.reasoning}</p>
                    </PredictionCard>
                  ))}

                {predictions.pit_windows.length === 0 && (
                  <p className="text-pit-muted text-sm col-span-full text-center py-6">
                    No stint data available to generate
                    recommendations yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tyre strategy */}
          <section>
            <p className="stat-label mb-3">
              Tyre Strategy
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.tyre_predictions.map((t) => (
                <TyreCard
                  key={t.driver_number}
                  prediction={t}
                />
              ))}

              {predictions.tyre_predictions.length === 0 && (
                <p className="text-pit-muted text-sm col-span-full text-center py-6">
                  No stint data yet.
                </p>
              )}
            </div>
          </section>

          {/* Race timeline */}
          <div className="glass-panel p-5">
            <p className="stat-label mb-3">
              Race Timeline
            </p>
            <RaceTimeline messages={raceControl} />
          </div>
        </>
      )}
    </div>
  );
}