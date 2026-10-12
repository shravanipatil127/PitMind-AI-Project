import {
  Activity,
  Bot,
  Cpu,
  Flag,
  Gauge,
  History,
  LayoutDashboard,
  Settings as SettingsIcon,
  Target,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/live", label: "Live Race", icon: Flag },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/telemetry", label: "Telemetry", icon: Gauge },
  { to: "/strategy", label: "Strategy", icon: Target },
  { to: "/predictions", label: "Predictions", icon: Cpu },
  { to: "/race-engineer", label: "Race Engineer", icon: Wrench },
  { to: "/chat", label: "AI Chat", icon: Bot },
  { to: "/historical", label: "Historical Replay", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-pit-border bg-pit-charcoal/80 backdrop-blur-md h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-6">
        <Activity className="text-pit-red" size={26} />
        <div>
          <p className="font-bold tracking-tight text-lg leading-none">PitMind AI</p>
          <p className="text-xs text-pit-muted">Race Engineer</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-pit-red/15 text-pit-red border border-pit-red/30"
                  : "text-pit-muted hover:text-pit-text hover:bg-white/5"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 text-xs text-pit-muted border-t border-pit-border">
        Data via OpenF1 API
      </div>
    </aside>
  );
}
