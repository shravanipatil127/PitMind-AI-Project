const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  retries?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { retries = 2, ...init } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...init.headers },
        ...init,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new ApiError(`Request failed (${response.status}): ${body}`, response.status);
      }

      return (await response.json()) as T;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown API error");
}

export const api = {
  health: () => request("/health"),
  sessions: (params: Record<string, string | number | undefined> = {}) =>
    request(`/sessions${toQuery(params)}`),
  latestSession: () => request("/sessions/latest"),
  drivers: (sessionKey?: number) => request(`/drivers${toQuery({ session_key: sessionKey })}`),
  leaderboard: (sessionKey?: number) =>
    request(`/race/leaderboard${toQuery({ session_key: sessionKey })}`),
  laps: (sessionKey?: number, driverNumber?: number) =>
    request(`/race/laps${toQuery({ session_key: sessionKey, driver_number: driverNumber })}`),
  telemetry: (sessionKey?: number, driverNumber?: number) =>
    request(`/telemetry${toQuery({ session_key: sessionKey, driver_number: driverNumber })}`),
  tyres: (sessionKey?: number, driverNumber?: number) =>
    request(`/tyres${toQuery({ session_key: sessionKey, driver_number: driverNumber })}`),
  weather: (sessionKey?: number) => request(`/weather${toQuery({ session_key: sessionKey })}`),
  predictions: (sessionKey?: number) =>
    request(`/predictions${toQuery({ session_key: sessionKey })}`),
  explainRace: (sessionKey?: number) =>
    request(`/predictions/explain${toQuery({ session_key: sessionKey })}`),
  aiStatus: () => request("/ai/status"),
  chat: (body: unknown) =>
    request("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
  raceControl: (sessionKey?: number) =>
    request(`/race/control${toQuery({ session_key: sessionKey })}`),
  meetings: (year?: number) => request(`/historical/meetings${toQuery({ year })}`),
  replay: (sessionKey: number, driverNumber?: number) =>
    request(
      `/historical/replay${toQuery({ session_key: sessionKey, driver_number: driverNumber })}`
    ),
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
  return `?${search.toString()}`;
}

export { API_BASE_URL };
