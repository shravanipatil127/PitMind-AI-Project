import { AlertTriangle, CheckCircle2, Flag, ShieldAlert } from "lucide-react";

import type { SafetyCarRisk, SessionInfo } from "../types";

const RISK_STYLES: Record<string, { text: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  low: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  medium: { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertTriangle },
  high: { text: "text-pit-red", bg: "bg-pit-red/10", border: "border-pit-red/30", icon: ShieldAlert },
};

export default function TrackStatus({
  session,
  safetyCar,
}: {
  session?: SessionInfo | null;
  safetyCar?: SafetyCarRisk | null;
}) {
  const risk = safetyCar?.risk_level || "low";
  const style = RISK_STYLES[risk] || RISK_STYLES.low;
  const Icon = style.icon;

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag size={16} className="text-pit-red" />
        <p className="stat-label">Track Status</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold">{session?.session_name || "No active session"}</p>
          <p className="text-xs text-pit-muted">
            {session?.circuit_short_name || session?.location || "—"}
            {session?.country_name ? `, ${session.country_name}` : ""}
          </p>
        </div>
      </div>

      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${style.bg} ${style.border}`}>
        <Icon size={16} className={style.text} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold capitalize ${style.text}`}>
            {risk} risk{safetyCar ? ` · ${safetyCar.risk_pct}%` : ""}
          </p>
          {safetyCar?.reasoning && <p className="text-xs text-pit-muted truncate">{safetyCar.reasoning}</p>}
        </div>
      </div>
    </div>
  );
}
