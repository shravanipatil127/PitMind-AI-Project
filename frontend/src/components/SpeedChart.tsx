import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { CarTelemetry } from "../types";

export default function SpeedChart({ telemetry }: { telemetry: CarTelemetry[] }) {
  const data = telemetry
    .filter((t) => Number(t.speed) > 0)
    .slice(-100)
    .map((t, idx) => ({ idx, speed: t.speed }));

  return (
    <div className="glass-panel p-4">
      <p className="stat-label mb-2">Speed (km/h)</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="idx" hide />
          <YAxis stroke="#9A9AA5" fontSize={11} width={36} />
          <Tooltip
            contentStyle={{ background: "#1B1B20", border: "1px solid #2A2A31", borderRadius: 8 }}
            labelFormatter={() => ""}
          />
          <Line type="monotone" dataKey="speed" stroke="#E10600" strokeWidth={2} dot={false} isAnimationActive />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
