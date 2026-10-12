import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "../api/client";
import ErrorScreen from "../components/ErrorScreen";
import LapTable from "../components/LapTable";
import { GridSkeleton } from "../components/LoadingSkeleton";
import WeatherWidget from "../components/WeatherWidget";
import type { LapTime, SessionInfo, WeatherReading } from "../types";

interface ReplayData {
  session_key: number;
  laps: LapTime[];
  positions: unknown[];
  stints: unknown[];
  weather: WeatherReading[];
}

export default function HistoricalReplay() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | undefined>(undefined);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<SessionInfo[]>({
    queryKey: ["historical-sessions", year],
    queryFn: () => api.sessions({ year }) as Promise<SessionInfo[]>,
  });

  const {
    data: replay,
    isLoading: replayLoading,
    isError,
    refetch,
  } = useQuery<ReplayData>({
    queryKey: ["replay", selectedSessionKey],
    queryFn: () => api.replay(selectedSessionKey as number) as Promise<ReplayData>,
    enabled: !!selectedSessionKey,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-pit-muted">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => {
            setYear(Number(e.target.value));
            setSelectedSessionKey(undefined);
          }}
          className="bg-white/5 border border-pit-border rounded-xl px-3 py-2 text-sm w-28 outline-none focus:border-pit-red/50"
        />

        <label className="text-sm text-pit-muted ml-4">Session</label>
        <select
          value={selectedSessionKey ?? ""}
          onChange={(e) => setSelectedSessionKey(e.target.value ? Number(e.target.value) : undefined)}
          className="bg-white/5 border border-pit-border rounded-xl px-3 py-2 text-sm outline-none focus:border-pit-red/50"
        >
          <option value="" className="bg-[#1c1c21] text-white">
            Select a session...
          </option>
          {sessions.map((s) => (
            <option
              key={s.session_key}
              value={s.session_key}
              className="bg-[#1c1c21] text-white"
            >
              {s.year} · {s.country_name} · {s.session_name}
            </option>
          ))}
        </select>
      </div>

      {sessionsLoading && <GridSkeleton count={2} />}

      {!selectedSessionKey && !sessionsLoading && (
        <p className="text-pit-muted text-sm py-10 text-center">
          Choose a past session above to replay its laps and conditions.
        </p>
      )}

      {selectedSessionKey && replayLoading && <GridSkeleton count={2} />}
      {selectedSessionKey && isError && <ErrorScreen onRetry={() => refetch()} />}

      {replay && (
        <div className="space-y-6">
          <WeatherWidget weather={replay.weather[replay.weather.length - 1]} />
          <div className="glass-panel p-5">
            <p className="stat-label mb-3">Lap History</p>
            <LapTable laps={replay.laps} />
          </div>
        </div>
      )}
    </div>
  );
}
