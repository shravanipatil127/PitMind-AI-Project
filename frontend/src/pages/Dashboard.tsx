import { motion } from "framer-motion";

import { Cloud, Cpu, Flag, TrendingUp } from "lucide-react";

import ErrorScreen from "../components/ErrorScreen";
import { GridSkeleton } from "../components/LoadingSkeleton";
import TrackStatus from "../components/TrackStatus";
import WeatherWidget from "../components/WeatherWidget";
import {
  useLatestSession,
  useLeaderboard,
  usePredictions,
  useWeather,
} from "../hooks/useRaceData";

export default function Dashboard() {
  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
  } = useLatestSession();

  const { data: leaderboard = [] } = useLeaderboard(session?.session_key);
  const { data: weather = [] } = useWeather(session?.session_key);
  const { data: predictions } = usePredictions(session?.session_key);

  if (sessionLoading) return <GridSkeleton count={4} />;
  if (sessionError) {
    return <ErrorScreen message="Couldn't load session info from the backend." />;
  }

  // Check whether the latest session is actually happening right now.
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

  const leader = leaderboard[0];
  const winnerPick = predictions?.winner?.[0];

  const stats = [
    {
      icon: Flag,
      label: isLive ? "Current Session" : "Latest Session",
      value: session?.session_name || "No session",
      sub: session?.circuit_short_name || session?.location || "—",
    },
    {
      icon: TrendingUp,
      label: isLive ? "Race Leader" : "Session Leader",
      value: leader
        ? leader.full_name || `#${leader.driver_number}`
        : "—",
      sub: leader?.team_name || "—",
    },
    {
      icon: Cpu,
      label: "Win Probability Leader",
      value: winnerPick
        ? `Driver #${winnerPick.driver_number}`
        : "—",
      sub: winnerPick
        ? `${winnerPick.win_probability_pct}%`
        : "—",
    },
    {
      icon: Cloud,
      label: "Track Temp",
      value: weather.length
        ? `${weather[weather.length - 1].track_temperature}°C`
        : "—",
      sub: isLive ? "Live from OpenF1" : "Latest OpenF1 reading",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Session status */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-emerald-400 animate-pulse" : "bg-pit-muted"
              }`}
          />

          <div>
            <p className="text-sm font-semibold">
              {isLive
                ? "LIVE SESSION"
                : "NO LIVE SESSION"}
            </p>

            <p className="text-xs text-pit-muted mt-1">
              {isLive
                ? `${session?.session_name || "F1 session"} · ${session?.country_name || session?.location || ""}`
                : session
                  ? `Showing latest completed session: ${session.session_name || "Session"
                  } · ${session.country_name || session.location || ""
                  }`
                  : "No F1 session data available."}
            </p>
          </div>
        </div>
      </div>

      {/* Main statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, sub }, idx) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-panel glass-panel-hover p-5"
          >
            <Icon className="text-pit-red mb-3" size={20} />

            <p className="stat-label">{label}</p>

            <p className="text-xl font-bold mt-1 truncate">
              {value}
            </p>

            <p className="text-xs text-pit-muted mt-1 truncate">
              {sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Track + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrackStatus
          session={session}
          safetyCar={predictions?.safety_car}
        />

        <WeatherWidget
          weather={weather[weather.length - 1]}
        />
      </div>

      {/* Leaderboard */}
      <div className="glass-panel p-5">
        <p className="stat-label mb-3">
          {isLive
            ? "Live Leaderboard Preview"
            : "Latest Session Leaderboard"}
        </p>

        {leaderboard.slice(0, 5).map((entry) => (
          <div
            key={entry.driver_number}
            className="flex items-center justify-between py-2 border-b border-pit-border/50 last:border-0"
          >
            <span className="text-sm">
              {entry.position}.{" "}
              {entry.full_name ||
                `Driver #${entry.driver_number}`}
            </span>

            <span className="text-xs text-pit-muted">
              {entry.team_name}
            </span>
          </div>
        ))}

        {leaderboard.length === 0 && (
          <p className="text-pit-muted text-sm py-4 text-center">
            {isLive
              ? "Waiting for live leaderboard data..."
              : "No leaderboard data available."}
          </p>
        )}
      </div>
    </div>
  );
}