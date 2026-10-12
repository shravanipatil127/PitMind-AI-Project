import { motion } from "framer-motion";

import type { LeaderboardEntry } from "../types";

export default function LiveLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-pit-muted text-sm py-6 text-center">No live position data available.</p>;
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry) => {
        const accent = entry.team_colour ? `#${entry.team_colour}` : "#9A9AA5";
        return (
          <motion.div
            layout
            key={entry.driver_number}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-7 text-center font-bold text-pit-muted">{entry.position}</div>
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accent }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {entry.full_name || `Driver #${entry.driver_number}`}
              </p>
              <p className="text-xs text-pit-muted truncate">{entry.team_name}</p>
            </div>
            <span className="font-mono text-xs text-pit-muted">
              {entry.name_acronym || entry.driver_number}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
