"use client";
import { MapView } from "@/components/MapView";
import { PageHeader } from "@/components/PageHeader";
import { PriorityList } from "@/components/PriorityList";
import { StatCard } from "@/components/StatCard";
import { useAnalytics, useHotspots, usePriorityZones, useSimulation } from "@/hooks/useApi";

export default function Dashboard() {
  const { data: hotspots } = useHotspots();
  const { data: analytics } = useAnalytics();
  const { data: zones } = usePriorityZones(10);
  const { data: sim } = useSimulation(5, 0.85);

  const m = analytics?.metrics ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        tag="Command Center"
        title="City Dashboard"
        subtitle="Illegal-parking hotspots, congestion impact & enforcement priorities — Bengaluru grid."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Violations analyzed" value={(m.rows_clean ?? 0).toLocaleString()} accent="cyan" />
        <StatCard label="Hotspot cells (95%)" value={m.n_hotspots_95 ?? "—"} sub={`of ${m.n_cells ?? "—"} cells`} accent="magenta" />
        <StatCard label="Mean PCII" value={m.pcii_mean ?? "—"} sub={`max ${m.pcii_max ?? "—"}`} accent="violet" />
        <StatCard
          label="Top-5 enforcement"
          value={sim ? `${sim.reduction_pct.toFixed(1)}%` : "—"}
          sub="projected impact ↓"
          accent="lime"
          pulse
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <MapView data={hotspots} colorBy="pcii" />
        </div>
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-neon-cyan/80 mb-2">
            ≡ Top enforcement zones
          </h2>
          {zones && <PriorityList zones={zones} />}
        </div>
      </div>
    </div>
  );
}
