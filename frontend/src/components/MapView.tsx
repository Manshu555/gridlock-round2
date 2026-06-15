"use client";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";

import type { FeatureCollection } from "@/lib/types";

import "maplibre-gl/dist/maplibre-gl.css";

// Free, no-token basemap (CARTO dark-matter). Override via NEXT_PUBLIC_MAP_STYLE.
// Alternative free style: https://tiles.openfreemap.org/styles/liberty
const STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ??
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapRef.current = new maplibregl.Map({
      container: ref.current,
      style: STYLE,
      center: [77.59, 12.97],
      zoom: 10.5,
      attributionControl: { compact: true },
    });
    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
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
          // neon ramp: deep blue -> cyan -> violet -> magenta
          "fill-color": [
            "interpolate", ["linear"], ["coalesce", ["get", colorBy], 0],
            0, "#0e1b3a", 25, "#22d3ee", 50, "#a855f7", 75, "#ff2bd6", 100, "#ff6ae6",
          ],
          "fill-opacity": 0.6,
        },
      });
      map.addLayer({
        id: "cells-line",
        type: "line",
        source: "cells",
        paint: { "line-color": "#22d3ee", "line-width": 0.4, "line-opacity": 0.5 },
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

  return (
    <div className="relative h-[600px] w-full rounded-xl overflow-hidden neon-border">
      <div ref={ref} className="h-full w-full" />
      {/* scanline + vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{
          boxShadow: "inset 0 0 80px rgba(5,7,15,0.85)",
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(34,211,238,0.05) 0px, rgba(34,211,238,0.05) 1px, transparent 2px, transparent 4px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
