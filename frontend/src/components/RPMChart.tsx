import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CarTelemetry } from "../types";

export default function RPMChart({ telemetry }: { telemetry: CarTelemetry[] }) {
  const data = telemetry
    .filter((t) => Number(t.rpm) > 0)
    .slice(-100)
    .map((t, idx) => ({ idx, rpm: t.rpm }));

  return (
    <div className="glass-panel p-4">
      <p className="stat-label mb-2">RPM</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="rpmGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E10600" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#E10600" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="idx" hide />
          <YAxis stroke="#9A9AA5" fontSize={11} width={40} />
          <Tooltip
            contentStyle={{ background: "#1B1B20", border: "1px solid #2A2A31", borderRadius: 8 }}
            labelFormatter={() => ""}
          />
          <Area type="monotone" dataKey="rpm" stroke="#E10600" fill="url(#rpmGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
