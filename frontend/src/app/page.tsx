"use client";
import { MapView } from "@/components/MapView";
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Command Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Illegal-parking hotspots, congestion impact & enforcement priorities — Bengaluru
          </p>
        </div>
        {m.rows_clean && (
          <div className="text-xs text-slate-500 bg-surface px-3 py-1.5 rounded-lg border border-white/[0.06]">
            {m.rows_clean.toLocaleString()} records analyzed
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Violations Analyzed" value={(m.rows_clean ?? 0).toLocaleString()} />
        <StatCard label="Hotspot Cells (95%)" value={m.n_hotspots_95 ?? "—"} sub={`of ${m.n_cells ?? "—"} total`} />
        <StatCard label="Mean PCII" value={m.pcii_mean ?? "—"} sub={`max ${m.pcii_max ?? "—"}`} />
        <StatCard
          label="Top-5 Enforcement"
          value={sim ? `${sim.reduction_pct.toFixed(1)}%` : "—"}
          sub="projected impact reduction"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MapView data={hotspots} colorBy="pcii" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Top Enforcement Zones</h2>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">by EPS priority</div>
          </div>
          <div className="h-[520px] overflow-y-auto pr-2" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 1%, black 99%, transparent 100%)' }}>
            {zones && <PriorityList zones={zones} />}
          </div>
        </div>
      </div>
    </div>
  );
}
