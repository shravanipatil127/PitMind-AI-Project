export interface HealthStatus {
  status: string;
  app_name: string;
  ai_provider: string;
  llm_configured: boolean;
  timestamp: string;
}

export interface SessionInfo {
  session_key: number;
  session_name: string;
  session_type?: string;
  meeting_key?: number;
  location?: string;
  country_name?: string;
  circuit_short_name?: string;
  date_start?: string;
  date_end?: string;
  year?: number;
}

export interface Driver {
  driver_number: number;
  broadcast_name?: string;
  full_name?: string;
  name_acronym?: string;
  team_name?: string;
  team_colour?: string;
  country_code?: string;
  headshot_url?: string;
}

export interface LeaderboardEntry {
  driver_number: number;
  position: number;
  full_name?: string;
  team_name?: string;
  team_colour?: string;
  name_acronym?: string;
  headshot_url?: string;
}

export interface LapTime {
  driver_number: number;
  lap_number?: number;
  lap_duration?: number;
  duration_sector_1?: number;
  duration_sector_2?: number;
  duration_sector_3?: number;
  is_pit_out_lap?: boolean;
  date_start?: string;
}

export interface CarTelemetry {
  driver_number: number;
  date?: string;
  speed?: number;
  rpm?: number;
  n_gear?: number;
  throttle?: number;
  brake?: number;
  drs?: number;
}

export interface TyreStint {
  driver_number: number;
  stint_number?: number;
  compound?: string;
  lap_start?: number;
  lap_end?: number;
  tyre_age_at_start?: number;
}

export interface WeatherReading {
  date?: string;
  air_temperature?: number;
  track_temperature?: number;
  humidity?: number;
  rainfall?: number;
  wind_speed?: number;
  wind_direction?: number;
  pressure?: number;
}

export interface TyreWearPrediction {
  driver_number: number;
  compound: string;
  estimated_age_laps: number;
  estimated_wear_pct: number;
  degradation_trend: string;
  confidence: number;
}

export interface PitWindowPrediction {
  driver_number: number;
  recommended_lap_earliest: number;
  recommended_lap_latest: number;
  reasoning: string;
  confidence: number;
}

export interface OvertakePrediction {
  attacker_driver_number: number;
  defender_driver_number: number;
  gap_seconds: number | null;
  likelihood_pct: number;
  reasoning: string;
}

export interface WinnerPrediction {
  driver_number: number;
  win_probability_pct: number;
  reasoning: string;
}

export interface SafetyCarRisk {
  risk_level: "low" | "medium" | "high";
  risk_pct: number;
  reasoning: string;
}

export interface PredictionsBundle {
  session_key: number | null;
  generated_by: string;
  tyre_predictions: TyreWearPrediction[];
  pit_windows: PitWindowPrediction[];
  overtakes: OvertakePrediction[];
  winner: WinnerPrediction[];
  safety_car: SafetyCarRisk | null;
}

export interface RaceExplanation {
  headline: string;
  narrative: string;
  key_factors: string[];
  generated_by: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
  generated_by: string;
  suggestions: string[];
}

export interface LiveSnapshot {
  type: "snapshot" | "error";
  leaderboard?: LeaderboardEntry[];
  weather?: WeatherReading | null;
  safety_car?: SafetyCarRisk | null;
  ai_provider?: string;
  detail?: string;
}
