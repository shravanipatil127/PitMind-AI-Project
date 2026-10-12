import { AlertTriangle, Clock, Swords, Trophy } from "lucide-react";

import ErrorScreen from "../components/ErrorScreen";
import { GridSkeleton } from "../components/LoadingSkeleton";
import PredictionCard from "../components/PredictionCard";
import TyreCard from "../components/TyreCard";
import { useLatestSession, usePredictions } from "../hooks/useRaceData";

export default function Predictions() {
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
              {isLive
                ? "LIVE PREDICTIONS"  
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
          <p className="stat-label mb-2">
            Predictions
          </p>

          <h2 className="text-xl font-bold">
            No live F1 session is currently in progress.
          </h2>

          <p className="text-sm text-pit-muted mt-2">
            Live tyre wear, pit windows, overtake battles,
            safety-car risk and win probabilities will appear
            here when an active F1 session is available.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLive && isLoading && (
        <GridSkeleton count={6} />
      )}

      {/* Error */}
      {isLive && isError && (
        <ErrorScreen onRetry={() => refetch()} />
      )}

      {/* Predictions */}
      {isLive && predictions && (
        <>
          {/* Safety Car Risk */}
          {predictions.safety_car && (
            <div className="glass-panel p-5 flex items-center gap-4">
              <AlertTriangle
                size={22}
                className={
                  predictions.safety_car.risk_level === "high"
                    ? "text-pit-red"
                    : predictions.safety_car.risk_level === "medium"
                      ? "text-yellow-400"
                      : "text-emerald-400"
                }
              />

              <div>
                <p className="font-semibold capitalize">
                  Safety Car Risk:{" "}
                  {predictions.safety_car.risk_level} (
                  {predictions.safety_car.risk_pct}%)
                </p>

                <p className="text-sm text-pit-muted">
                  {predictions.safety_car.reasoning}
                </p>
              </div>
            </div>
          )}

          {/* Tyre Wear */}
          <section>
            <p className="stat-label mb-3">
              Tyre Wear
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

          {/* Pit Windows */}
          <section>
            <p className="stat-label mb-3">
              Pit Windows
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.pit_windows.map((w) => (
                <PredictionCard
                  key={w.driver_number}
                  title={`Driver #${w.driver_number}`}
                  icon={
                    <Clock
                      size={16}
                      className="text-pit-red"
                    />
                  }
                  confidence={w.confidence}
                >
                  <p className="mb-1">
                    Lap {w.recommended_lap_earliest}–
                    {w.recommended_lap_latest}
                  </p>

                  <p>{w.reasoning}</p>
                </PredictionCard>
              ))}

              {predictions.pit_windows.length === 0 && (
                <p className="text-pit-muted text-sm col-span-full text-center py-6">
                  No pit-window predictions available yet.
                </p>
              )}
            </div>
          </section>

          {/* Overtake Battles */}
          <section>
            <p className="stat-label mb-3">
              Overtake Battles
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.overtakes
                .slice(0, 6)
                .map((o, idx) => (
                  <PredictionCard
                    key={idx}
                    title={`#${o.attacker_driver_number} vs #${o.defender_driver_number}`}
                    icon={
                      <Swords
                        size={16}
                        className="text-pit-red"
                      />
                    }
                  >
                    <p className="mb-1">
                      {o.likelihood_pct}% overtake likelihood
                    </p>

                    <p>{o.reasoning}</p>
                  </PredictionCard>
                ))}

              {predictions.overtakes.length === 0 && (
                <p className="text-pit-muted text-sm col-span-full text-center py-6">
                  No close battles detected.
                </p>
              )}
            </div>
          </section>

          {/* Win Probability */}
          <section>
            <p className="stat-label mb-3">
              Win Probability
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.winner
                .slice(0, 6)
                .map((w) => (
                  <PredictionCard
                    key={w.driver_number}
                    title={`Driver #${w.driver_number}`}
                    icon={
                      <Trophy
                        size={16}
                        className="text-pit-red"
                      />
                    }
                  >
                    <p className="text-xl font-bold text-pit-text mb-1">
                      {w.win_probability_pct}%
                    </p>

                    <p>{w.reasoning}</p>
                  </PredictionCard>
                ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}