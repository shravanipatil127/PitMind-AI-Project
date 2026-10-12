import type { LapTime } from "../types";

function formatDuration(seconds?: number) {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds % 60).toFixed(3);
  return minutes > 0 ? `${minutes}:${rest.padStart(6, "0")}` : rest;
}

export default function LapTable({ laps }: { laps: LapTime[] }) {
  const sorted = [...laps].sort((a, b) => (b.lap_number || 0) - (a.lap_number || 0)).slice(0, 20);

  if (sorted.length === 0) {
    return <p className="text-pit-muted text-sm py-6 text-center">No lap data available yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-pit-muted text-xs uppercase tracking-wider border-b border-pit-border">
            <th className="py-2 pr-4">Lap</th>
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">S1</th>
            <th className="py-2 pr-4">S2</th>
            <th className="py-2 pr-4">S3</th>
            <th className="py-2">Pit</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lap, idx) => (
            <tr key={`${lap.lap_number}-${idx}`} className="border-b border-pit-border/50 hover:bg-white/5">
              <td className="py-2 pr-4 font-mono">{lap.lap_number ?? "—"}</td>
              <td className="py-2 pr-4 font-mono">{formatDuration(lap.lap_duration)}</td>
              <td className="py-2 pr-4 font-mono text-pit-muted">{formatDuration(lap.duration_sector_1)}</td>
              <td className="py-2 pr-4 font-mono text-pit-muted">{formatDuration(lap.duration_sector_2)}</td>
              <td className="py-2 pr-4 font-mono text-pit-muted">{formatDuration(lap.duration_sector_3)}</td>
              <td className="py-2">
                {lap.is_pit_out_lap ? <span className="badge bg-pit-red/15 text-pit-red">OUT</span> : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
