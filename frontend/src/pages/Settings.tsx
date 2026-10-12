import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  Database,
  Info,
  Key,
  Monitor,
  Server,
  Settings as SettingsIcon,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { api, API_BASE_URL } from "../api/client";

interface AIStatus {
  active_provider: string;
  llm_configured: boolean;
  note: string;
}

export default function Settings() {
  const { data: aiStatus } = useQuery<AIStatus>({
    queryKey: ["ai-status"],
    queryFn: () => api.aiStatus() as Promise<AIStatus>,
  });

  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon size={20} className="text-pit-red" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-pit-muted">
          Configure your PitMind AI race-engineer experience.
        </p>
      </div>

      {/* General */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Monitor size={18} className="text-pit-red" />
          <p className="stat-label">General</p>
        </div>

        <div className="space-y-4">
          <SettingRow
            icon={<Monitor size={16} />}
            title="Appearance"
            description="Current application theme"
            value="Dark"
          />

          <SettingRow
            icon={<Zap size={16} />}
            title="Data refresh"
            description="Race data updates automatically when available"
            value="Automatic"
          />

          <SettingRow
            icon={<Bell size={16} />}
            title="Notifications"
            description="Race and strategy notifications"
            value="Enabled"
          />
        </div>
      </section>

      {/* Race Data */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Database size={18} className="text-pit-red" />
          <p className="stat-label">Race Data</p>
        </div>

        <div className="space-y-4">
          <SettingRow
            icon={<Database size={16} />}
            title="Data source"
            description="Formula 1 timing and session data"
            value="OpenF1"
          />

          <SettingRow
            icon={<Zap size={16} />}
            title="Live data"
            description="Automatically uses live data during active sessions"
            value="Automatic"
          />

          <SettingRow
            icon={<Database size={16} />}
            title="Historical replay"
            description="Access completed F1 sessions and lap history"
            value="Enabled"
          />
        </div>
      </section>

      {/* AI Race Engineer */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bot size={18} className="text-pit-red" />
          <p className="stat-label">AI Race Engineer</p>
        </div>

        <div className="space-y-4">
          <SettingRow
            icon={<Bot size={16} />}
            title="AI provider"
            description="Engine currently powering race intelligence"
            value={
              aiStatus?.active_provider
                ? aiStatus.active_provider.replace("_", " ")
                : "Loading…"
            }
          />

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="text-pit-muted">
                <Key size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">LLM enhancement</p>
                <p className="text-xs text-pit-muted">
                  Optional external language-model integration
                </p>
              </div>
            </div>

            <span
              className={`badge whitespace-nowrap border ${
                aiStatus?.llm_configured
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-white/5 text-pit-muted border-pit-border"
              }`}
            >
              {aiStatus?.llm_configured ? "Configured" : "Not configured"}
            </span>
          </div>

          <div className="rounded-xl border border-pit-border bg-white/[0.02] p-4">
            <p className="text-sm font-medium mb-1">
              Current AI mode
            </p>
            <p className="text-xs text-pit-muted leading-relaxed">
              {aiStatus?.note ||
                "PitMind AI is using its default race-intelligence engine."}
            </p>
          </div>
        </div>
      </section>

      {/* System */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Server size={18} className="text-pit-red" />
          <p className="stat-label">System</p>
        </div>

        <div className="space-y-4">
          <SettingRow
            icon={<Server size={16} />}
            title="Backend"
            description="PitMind FastAPI backend"
            value="Connected"
            valueClass="text-emerald-400"
          />

          <SettingRow
            icon={<CheckCircle2 size={16} />}
            title="API connection"
            description="Frontend communication with backend"
            value="Connected"
            valueClass="text-emerald-400"
          />

          <SettingRow
            icon={<Info size={16} />}
            title="Application"
            description="PitMind AI Race Engineer"
            value="v1.0"
          />
        </div>
      </section>

      {/* Advanced */}
      <section className="glass-panel overflow-hidden">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition"
        >
          <div className="flex items-center gap-3">
            <Info size={18} className="text-pit-red" />
            <div>
              <p className="stat-label">Advanced Configuration</p>
              <p className="text-xs text-pit-muted mt-1">
                Developer and API configuration
              </p>
            </div>
          </div>

          <ChevronDown
            size={18}
            className={`text-pit-muted transition-transform ${
              advancedOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {advancedOpen && (
          <div className="border-t border-pit-border p-6 space-y-5">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-pit-muted">API base URL</span>
              <span className="font-mono text-right break-all">
                {API_BASE_URL}
              </span>
            </div>

            <div className="rounded-xl border border-pit-border bg-white/[0.02] p-4">
              <p className="text-sm font-medium mb-2">
                Optional LLM configuration
              </p>

              <p className="text-xs text-pit-muted leading-relaxed">
                To enable LLM-enhanced narratives and chat, configure{" "}
                <code className="text-pit-text">OPENAI_API_KEY</code>,{" "}
                <code className="text-pit-text">OPENAI_BASE_URL</code>, and{" "}
                <code className="text-pit-text">LLM_MODEL</code> in the
                backend environment and select the OpenAI-compatible
                provider.
              </p>
            </div>

            <div className="flex items-start gap-2 text-xs text-pit-muted">
              <Info size={14} className="mt-0.5 shrink-0" />
              <p>
                API keys and environment variables are managed on the
                backend and are not displayed here.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  value,
  valueClass = "text-pit-text",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-pit-muted">{icon}</div>

        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-pit-muted">{description}</p>
        </div>
      </div>

      <span className={`text-sm font-medium capitalize ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}