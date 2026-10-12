import { GridSkeleton } from "../components/LoadingSkeleton";
import { useDrivers, useLatestSession } from "../hooks/useRaceData";
import type { Driver } from "../types";

export default function Teams() {
  const { data: session } = useLatestSession();
  const { data: drivers = [], isLoading } = useDrivers(session?.session_key);

  if (isLoading) return <GridSkeleton count={6} />;

  const teams = new Map<string, Driver[]>();
  for (const driver of drivers) {
    const key = driver.team_name || "Unknown";
    if (!teams.has(key)) teams.set(key, []);
    teams.get(key)!.push(driver);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from(teams.entries()).map(([team, teamDrivers]) => {
        const accent = teamDrivers[0]?.team_colour ? `#${teamDrivers[0].team_colour}` : "#9A9AA5";
        return (
          <div key={team} className="glass-panel p-5" style={{ borderTop: `3px solid ${accent}` }}>
            <p className="font-bold text-lg mb-3">{team}</p>
            <div className="space-y-2">
              {teamDrivers.map((d) => (
                <div key={d.driver_number} className="flex items-center justify-between text-sm">
                  <span>{d.full_name || `Driver #${d.driver_number}`}</span>
                  <span className="text-pit-muted font-mono">#{d.driver_number}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {teams.size === 0 && (
        <p className="text-pit-muted text-sm col-span-full text-center py-10">No team data available.</p>
      )}
    </div>
  );
}
