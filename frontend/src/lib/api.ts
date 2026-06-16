import type {
  Analytics,
  FeatureCollection,
  ForecastResponse,
  PriorityZone,
  SimulationResponse,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => get<{ status: string; version: string; n_cells?: number }>("/health"),
  hotspots: (significantOnly = false, minScore = 0) =>
    get<FeatureCollection>(
      `/hotspots?significant_only=${significantOnly}&min_score=${minScore}`,
    ),
  hotspot: (id: string) => get<Record<string, unknown>>(`/hotspots/${id}`),
  priorityZones: (limit = 50) => get<PriorityZone[]>(`/priority-zones?limit=${limit}`),
  forecast: (h3?: string, limit = 1000) =>
    get<ForecastResponse>(`/db/forecast?limit=${limit}${h3 ? `&h3_id=${h3}` : ""}`),
  simulation: (k = 5, compliance = 0.85) =>
    get<SimulationResponse>(`/simulation?k=${k}&compliance=${compliance}`),
  analytics: () => get<Analytics>("/analytics"),
};
