"use client";
import { PriorityList } from "@/components/PriorityList";
import { usePriorityZones } from "@/hooks/useApi";

export default function PrioritiesPage() {
  const { data, isLoading } = usePriorityZones(100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Enforcement Priority Zones</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Ranked by EPS = 0.5·PCII + 0.3·violation-frequency + 0.2·road-criticality
        </p>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="card flex items-center justify-center h-[400px]">
          <div className="text-slate-400 animate-pulse-soft">Loading priority zones…</div>
        </div>
      )}
      {data && <PriorityList zones={data} />}
    </div>
  );
}
