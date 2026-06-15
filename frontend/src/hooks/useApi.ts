"use client";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const useHealth = () => useQuery({ queryKey: ["health"], queryFn: api.health });

export const useHotspots = (significantOnly = false, minScore = 0) =>
  useQuery({
    queryKey: ["hotspots", significantOnly, minScore],
    queryFn: () => api.hotspots(significantOnly, minScore),
  });

export const usePriorityZones = (limit = 50) =>
  useQuery({ queryKey: ["priority", limit], queryFn: () => api.priorityZones(limit) });

export const useForecast = (h3?: string) =>
  useQuery({ queryKey: ["forecast", h3], queryFn: () => api.forecast(h3) });

export const useSimulation = (k: number, compliance: number) =>
  useQuery({
    queryKey: ["simulation", k, compliance],
    queryFn: () => api.simulation(k, compliance),
  });

export const useAnalytics = () =>
  useQuery({ queryKey: ["analytics"], queryFn: api.analytics });
