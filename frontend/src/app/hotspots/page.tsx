"use client";
import { useState } from "react";

import { MapView } from "@/components/MapView";
import { useHotspots } from "@/hooks/useApi";

export default function HotspotsPage() {
  const [sigOnly, setSigOnly] = useState(false);
  const [colorBy, setColorBy] = useState<"pcii" | "hotspot_score">("hotspot_score");
  const { data, isLoading } = useHotspots(sigOnly, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Hotspot Map</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Getis-Ord Gi* significant clusters of illegal parking — color encodes intensity
        </p>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={sigOnly}
              onChange={(e) => setSigOnly(e.target.checked)}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white group-hover:text-accent transition-colors">
                Significant Only
              </span>
              <span className="text-xs text-slate-500">95% confidence level</span>
            </div>
          </label>

          <div className="h-8 w-px bg-white/[0.06]" />

          <label className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Color by:</span>
            <select
              value={colorBy}
              onChange={(e) => setColorBy(e.target.value as "pcii" | "hotspot_score")}
            >
              <option value="hotspot_score">Hotspot Score (Gi*)</option>
              <option value="pcii">Congestion Impact (PCII)</option>
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-accent animate-pulse-soft' : 'bg-emerald-500'}`} />
            <span className="text-xs text-slate-500 font-mono">
              {isLoading ? "loading…" : `${data?.features.length ?? 0} cells`}
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapView data={data} colorBy={colorBy} />
    </div>
  );
}
