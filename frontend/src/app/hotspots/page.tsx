"use client";
import { useState } from "react";

import { MapView } from "@/components/MapView";
import { PageHeader } from "@/components/PageHeader";
import { useHotspots } from "@/hooks/useApi";

export default function HotspotsPage() {
  const [sigOnly, setSigOnly] = useState(false);
  const [colorBy, setColorBy] = useState<"pcii" | "hotspot_score">("hotspot_score");
  const { data, isLoading } = useHotspots(sigOnly, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        tag="Geospatial Intel"
        title="Hotspot Map"
        subtitle="Getis-Ord Gi* significant clusters of illegal parking. Color encodes intensity."
      />

      <div className="flex flex-wrap gap-4 items-center card">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sigOnly} onChange={(e) => setSigOnly(e.target.checked)} />
          Significant only (95%)
        </label>
        <label className="flex items-center gap-2 text-sm">
          Color by:
          <select
            value={colorBy}
            onChange={(e) => setColorBy(e.target.value as "pcii" | "hotspot_score")}
            className="bg-slate-800 rounded px-2 py-1"
          >
            <option value="hotspot_score">Hotspot score (Gi*)</option>
            <option value="pcii">Congestion impact (PCII)</option>
          </select>
        </label>
        <span className="text-xs text-slate-500">
          {isLoading ? "loading…" : `${data?.features.length ?? 0} cells`}
        </span>
      </div>

      <MapView data={data} colorBy={colorBy} />
    </div>
  );
}
