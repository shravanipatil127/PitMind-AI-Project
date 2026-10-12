import { useQuery } from "@tanstack/react-query";

import { api } from "../api/client";
import type {
  Driver,
  LapTime,
  LeaderboardEntry,
  PredictionsBundle,
  SessionInfo,
  TyreStint,
  WeatherReading,
} from "../types";

export function useLatestSession() {
  return useQuery<SessionInfo>({
    queryKey: ["latest-session"],
    queryFn: () => api.latestSession() as Promise<SessionInfo>,
    refetchInterval: 30_000,
  });
}

export function useLeaderboard(sessionKey?: number) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", sessionKey],
    queryFn: () => api.leaderboard(sessionKey) as Promise<LeaderboardEntry[]>,
    refetchInterval: 5_000,
  });
}

export function useDrivers(sessionKey?: number) {
  return useQuery<Driver[]>({
    queryKey: ["drivers", sessionKey],
    queryFn: () => api.drivers(sessionKey) as Promise<Driver[]>,
    refetchInterval: 30_000,
  });
}

export function useLaps(sessionKey?: number, driverNumber?: number) {
  return useQuery<LapTime[]>({
    queryKey: ["laps", sessionKey, driverNumber],
    queryFn: () => api.laps(sessionKey, driverNumber) as Promise<LapTime[]>,
    refetchInterval: 10_000,
  });
}

export function useTyres(sessionKey?: number, driverNumber?: number) {
  return useQuery<TyreStint[]>({
    queryKey: ["tyres", sessionKey, driverNumber],
    queryFn: () => api.tyres(sessionKey, driverNumber) as Promise<TyreStint[]>,
    refetchInterval: 15_000,
  });
}

export function useWeather(sessionKey?: number) {
  return useQuery<WeatherReading[]>({
    queryKey: ["weather", sessionKey],
    queryFn: () => api.weather(sessionKey) as Promise<WeatherReading[]>,
    refetchInterval: 15_000,
  });
}

export function useRaceControl(sessionKey?: number, enabled = true) {
  return useQuery<
    { date?: string; category?: string; message?: string; flag?: string }[]
  >({
    queryKey: ["race-control", sessionKey],
    queryFn: () => api.raceControl(sessionKey) as Promise<any>,
    enabled: enabled && !!sessionKey,
    refetchInterval: 10_000,
  });
}

export function usePredictions(
  sessionKey?: number,
  enabled = true
) {
  return useQuery<PredictionsBundle>({
    queryKey: ["predictions", sessionKey],
    queryFn: () =>
      api.predictions(sessionKey) as Promise<PredictionsBundle>,
    enabled: enabled && !!sessionKey,
    refetchInterval: enabled ? 15_000 : false,
  });
}
