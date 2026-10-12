import { motion } from "framer-motion";

import type { Driver } from "../types";

export default function DriverCard({ driver }: { driver: Driver }) {
  const accent = driver.team_colour ? `#${driver.team_colour}` : "#E10600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel glass-panel-hover p-4 flex items-center gap-4"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
        style={{ backgroundColor: `${accent}33`, color: accent }}
      >
        {driver.name_acronym || driver.driver_number}
      </div>
      <div className="min-w-0">
        <p className="font-semibold truncate">{driver.full_name || `Driver #${driver.driver_number}`}</p>
        <p className="text-xs text-pit-muted truncate">{driver.team_name || "Unknown team"}</p>
      </div>
      <div className="ml-auto text-lg font-mono text-pit-muted">#{driver.driver_number}</div>
    </motion.div>
  );
}
