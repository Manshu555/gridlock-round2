"use client";
import { useState } from "react";

import { MapView } from "@/components/MapView";
import { useHotspots } from "@/hooks/useApi";

export default function HotspotsPage() {
  const [sigOnly, setSigOnly] = useState(false);
  const [colorBy, setColorBy] = useState<"pcii" | "hotspot_score">("hotspot_score");
  const { data, isLoading } = useHotspots(sigOnly, 0);

  return (
    <>
      {/* Full-screen map */}
      <div className="flex-1 relative bg-background border-r border-border">
        <div className="absolute inset-0">
          <MapView data={data} colorBy={colorBy} />
        </div>

        {/* Overlay controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
          {/* Left: filter controls */}
          <div className="bg-background border border-border flex items-center pointer-events-auto shadow-xl">
            {/* Significant only toggle */}
            <label className="flex items-center gap-3 cursor-pointer px-4 py-3 hover:bg-surface transition-colors group border-r border-border">
              <input
                type="checkbox"
                checked={sigOnly}
                onChange={(e) => setSigOnly(e.target.checked)}
                style={{ accentColor: '#FF3B00' }}
              />
              <div>
                <div className="font-mono text-label-md text-foreground uppercase tracking-wider group-hover:text-neon transition-colors">
                  Significant_Only
                </div>
                <div className="font-mono text-label-sm text-muted uppercase">95% confidence</div>
              </div>
            </label>

            {/* Color by selector */}
            <div className="relative px-4 py-3">
              <div className="font-mono text-label-sm text-muted uppercase tracking-widest mb-1">Color_By</div>
              <select
                value={colorBy}
                onChange={(e) => setColorBy(e.target.value as "pcii" | "hotspot_score")}
                className="appearance-none bg-transparent font-mono text-label-md text-foreground uppercase cursor-pointer focus:outline-none pr-6"
              >
                <option className="bg-background text-foreground" value="hotspot_score">Hotspot_Score (Gi*)</option>
                <option className="bg-background text-foreground" value="pcii">Impact_Score (PCII)</option>
              </select>
            </div>
          </div>

          {/* Right: status indicator */}
          <div className="bg-background border border-border px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-xl">
            <div className={`w-2 h-2 ${isLoading ? 'bg-neon animate-pulse-soft' : 'bg-foreground'}`} />
            <span className="font-mono text-label-md text-muted uppercase tracking-widest">
              {isLoading ? "Loading…" : `${data?.features.length ?? 0}_cells`}
            </span>
          </div>
        </div>
      </div>

      {/* Side legend panel */}
      <div className="w-[280px] bg-background border-l border-border flex flex-col p-8">
        <div className="border-b border-border pb-6 mb-6">
          <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Hotspots</div>
          <h2 className="font-sans text-headline-md text-foreground uppercase tracking-tight">Hotspot_Map</h2>
          <p className="font-sans text-body-sm text-muted mt-2">
            Getis-Ord Gi* significant clusters · color encodes intensity
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-4">Density_Scale</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-neon"></div>
                <span className="font-mono text-label-md text-foreground">High Impact</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-muted"></div>
                <span className="font-mono text-label-md text-muted">Moderate</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-border"></div>
                <span className="font-mono text-label-md text-muted">Low</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Cell_Count</div>
            <div className="font-mono text-display-massive text-neon tracking-tighter">
              {data?.features.length ?? "—"}
            </div>
            <div className="font-mono text-label-sm text-muted mt-2 uppercase">
              {isLoading ? "Loading…" : "H3 Hexagons"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
