import { CloudRain, Droplets, Thermometer, Wind } from "lucide-react";

import type { WeatherReading } from "../types";

export default function WeatherWidget({ weather }: { weather?: WeatherReading | null }) {
  if (!weather) {
    return (
      <div className="glass-panel p-4 text-pit-muted text-sm">No weather data available.</div>
    );
  }

  const items = [
    { icon: Thermometer, label: "Track Temp", value: `${weather.track_temperature ?? "—"}°C` },
    { icon: Thermometer, label: "Air Temp", value: `${weather.air_temperature ?? "—"}°C` },
    { icon: Droplets, label: "Humidity", value: `${weather.humidity ?? "—"}%` },
    { icon: Wind, label: "Wind", value: `${weather.wind_speed ?? "—"} m/s` },
    { icon: CloudRain, label: "Rainfall", value: weather.rainfall ? "Yes" : "No" },
  ];

  return (
    <div className="glass-panel p-4">
      <p className="stat-label mb-3">Track Conditions</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1">
            <Icon size={18} className="text-pit-red" />
            <p className="text-sm font-semibold">{value}</p>
            <p className="text-[10px] text-pit-muted uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
