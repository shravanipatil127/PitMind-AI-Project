import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { api } from "../api/client";
import ErrorScreen from "../components/ErrorScreen";
import { GridSkeleton } from "../components/LoadingSkeleton";
import RPMChart from "../components/RPMChart";
import SpeedChart from "../components/SpeedChart";
import { useDrivers, useLatestSession } from "../hooks/useRaceData";
import type { CarTelemetry } from "../types";

export default function Telemetry() {
  const { data: session } = useLatestSession();
  const { data: drivers = [] } = useDrivers(session?.session_key);

  const [driverNumber, setDriverNumber] = useState<number | undefined>(
    undefined
  );

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
    data: telemetry = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<CarTelemetry[]>({
    queryKey: ["telemetry-page", session?.session_key, driverNumber],

    queryFn: () =>
      api.telemetry(
        session?.session_key,
        driverNumber
      ) as Promise<CarTelemetry[]>,

    // Only request telemetry when:
    // 1. A driver is selected
    // 2. An actual session is currently running
    enabled: isLive && !!driverNumber,

    refetchInterval: isLive ? 5_000 : false,
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
                ? "LIVE TELEMETRY"
                : "NO LIVE SESSION"}
            </p>

            <p className="text-xs text-pit-muted mt-1">
              {isLive
                ? `${session?.session_name || "F1 session"} · ${session?.country_name ||
                session?.location ||
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

      {/* Driver selector */}
      {isLive && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-pit-muted">
            Driver
          </label>

          <select
            value={driverNumber ?? ""}
            onChange={(e) =>
              setDriverNumber(
                e.target.value
                  ? Number(e.target.value)
                  : undefined
              )
            }
            className="bg-[#1c1c21] text-white border border-pit-border rounded-xl px-3 py-2 text-sm outline-none focus:border-pit-red/50"
            style={{ colorScheme: "dark" }}
          >
            <option
              value=""
              className="bg-[#1c1c21] text-white"
            >
              Select a driver…
            </option>

            {drivers.map((d) => (
              <option
                key={d.driver_number}
                value={d.driver_number}
                className="bg-[#1c1c21] text-white"
              >
                {d.full_name ||
                  `Driver #${d.driver_number}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* No live session */}
      {!isLive && (
        <div className="glass-panel p-6">
          <p className="stat-label mb-2">
            Telemetry
          </p>

          <h2 className="text-xl font-bold">
            No live F1 session is currently in progress.
          </h2>

          <p className="text-sm text-pit-muted mt-2">
            Live speed and RPM telemetry will appear here
            when an active F1 session is available.
          </p>
        </div>
      )}

      {/* Driver not selected */}
      {isLive && !driverNumber && (
        <p className="text-pit-muted text-sm py-10 text-center">
          Select a driver above to load live telemetry
          (speed, RPM, throttle, brake).
        </p>
      )}

      {/* Loading */}
      {isLive && driverNumber && isLoading && (
        <GridSkeleton count={2} />
      )}

      {/* Error */}
      {isLive && driverNumber && isError && (
        <ErrorScreen onRetry={() => refetch()} />
      )}

      {/* Charts */}
      {isLive &&
        driverNumber &&
        !isLoading &&
        !isError && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SpeedChart telemetry={telemetry} />
            <RPMChart telemetry={telemetry} />
          </div>
        )}
    </div>
  );
}