import { Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AIChat from "./pages/AIChat";
import Dashboard from "./pages/Dashboard";
import Drivers from "./pages/Drivers";
import HistoricalReplay from "./pages/HistoricalReplay";
import LiveRace from "./pages/LiveRace";
import Predictions from "./pages/Predictions";
import RaceEngineer from "./pages/RaceEngineer";
import Settings from "./pages/Settings";
import Strategy from "./pages/Strategy";
import Teams from "./pages/Teams";
import Telemetry from "./pages/Telemetry";

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/live": "Live Race",
  "/drivers": "Drivers",
  "/teams": "Teams",
  "/telemetry": "Telemetry",
  "/strategy": "Strategy",
  "/predictions": "Predictions",
  "/race-engineer": "Race Engineer",
  "/chat": "AI Chat",
  "/historical": "Historical Replay",
  "/settings": "Settings",
};

export default function App() {
  const location = useLocation();
  const title = TITLES[location.pathname] || "PitMind AI";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar title={title} />
        <main className="flex-1 p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveRace />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/telemetry" element={<Telemetry />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/race-engineer" element={<RaceEngineer />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/historical" element={<HistoricalReplay />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
