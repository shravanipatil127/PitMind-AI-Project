import { Disc } from "lucide-react";

import type { TyreWearPrediction } from "../types";

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E10600",
  MEDIUM: "#F5C400",
  HARD: "#F5F5F7",
  INTERMEDIATE: "#3AA655",
  WET: "#1E6FE0",
  UNKNOWN: "#9A9AA5",
};

const TREND_COLORS: Record<string, string> = {
  worsening: "text-pit-red",
  stable: "text-pit-muted",
  improving: "text-emerald-400",
  unknown: "text-pit-muted",
};

export default function TyreCard({ prediction }: { prediction: TyreWearPrediction }) {
  const color = COMPOUND_COLORS[prediction.compound] || COMPOUND_COLORS.UNKNOWN;

  return (
    <div className="glass-panel glass-panel-hover p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Disc size={18} style={{ color }} />
          <p className="font-semibold">Driver #{prediction.driver_number}</p>
        </div>
        <span className="badge" style={{ backgroundColor: `${color}22`, color }}>
          {prediction.compound}
        </span>
      </div>

      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, prediction.estimated_wear_pct)}%`,
            backgroundColor: prediction.estimated_wear_pct > 80 ? "#E10600" : color,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-pit-muted">
        <span>{prediction.estimated_age_laps} laps old</span>
        <span>{prediction.estimated_wear_pct}% wear</span>
        <span className={TREND_COLORS[prediction.degradation_trend] || "text-pit-muted"}>
          {prediction.degradation_trend}
        </span>
      </div>
    </div>
  );
}
