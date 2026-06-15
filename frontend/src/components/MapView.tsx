"use client";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import type { FeatureCollection } from "@/lib/types";

import "mapbox-gl/dist/mapbox-gl.css";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function MapView({
  data,
  colorBy = "pcii",
  onSelect,
}: {
  data?: FeatureCollection;
  colorBy?: "pcii" | "hotspot_score" | "eps";
  onSelect?: (h3: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!TOKEN || !ref.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [77.59, 12.97],
      zoom: 10.5,
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    const render = () => {
      if (map.getLayer("cells-fill")) map.removeLayer("cells-fill");
      if (map.getLayer("cells-line")) map.removeLayer("cells-line");
      if (map.getSource("cells")) map.removeSource("cells");
      map.addSource("cells", { type: "geojson", data: data as never });
      map.addLayer({
        id: "cells-fill",
        type: "fill",
        source: "cells",
        paint: {
          "fill-color": [
            "interpolate", ["linear"], ["coalesce", ["get", colorBy], 0],
            0, "#1e3a8a", 25, "#22c55e", 50, "#f59e0b", 75, "#ef4444", 100, "#7f1d1d",
          ],
          "fill-opacity": 0.55,
        },
      });
      map.addLayer({
        id: "cells-line",
        type: "line",
        source: "cells",
        paint: { "line-color": "#0b0f1a", "line-width": 0.3 },
      });
      map.on("click", "cells-fill", (e) => {
        const f = e.features?.[0];
        if (f && onSelect) onSelect(String(f.properties?.h3));
      });
      map.on("mouseenter", "cells-fill", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "cells-fill", () => (map.getCanvas().style.cursor = ""));
    };
    if (map.isStyleLoaded()) render();
    else map.once("load", render);
  }, [data, colorBy, onSelect]);

  if (!TOKEN) {
    return (
      <div className="card h-[600px] flex items-center justify-center text-center text-slate-400">
        <div>
          <div className="text-lg mb-2">🗺️ Map disabled</div>
          <div className="text-sm">
            Set <code className="text-accent">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
            <code className="text-accent"> .env.local</code> to render the interactive map.
          </div>
        </div>
      </div>
    );
  }
  return <div ref={ref} className="h-[600px] w-full rounded-xl overflow-hidden" />;
}
