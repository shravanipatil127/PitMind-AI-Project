import { useQuery } from "@tanstack/react-query";
import { Cpu, Wifi, WifiOff } from "lucide-react";

import { api } from "../api/client";
import type { HealthStatus } from "../types";

export default function Navbar({ title }: { title: string }) {
  const { data, isError } = useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: () => api.health() as Promise<HealthStatus>,
    refetchInterval: 20_000,
  });

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-pit-border bg-pit-black/70 backdrop-blur-md">
      <h1 className="page-title">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 badge bg-white/5 border border-pit-border text-pit-muted">
          <Cpu size={13} />
          {data ? data.ai_provider.replace("_", " ") : "loading…"}
        </div>
        <div
          className={`flex items-center gap-1.5 badge border ${
            isError
              ? "bg-red-500/10 text-red-400 border-red-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}
        >
          {isError ? <WifiOff size={13} /> : <Wifi size={13} />}
          {isError ? "Backend offline" : "Connected"}
        </div>
      </div>
    </header>
  );
}
