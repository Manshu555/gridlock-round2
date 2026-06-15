"use client";
import { PriorityList } from "@/components/PriorityList";
import { usePriorityZones } from "@/hooks/useApi";

export default function PrioritiesPage() {
  const { data, isLoading } = usePriorityZones(100);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Enforcement Priority Zones</h1>
        <p className="text-slate-400 text-sm">
          Ranked by EPS = 0.5·PCII + 0.3·violation-frequency + 0.2·road-criticality.
        </p>
      </div>
      {isLoading && <div className="text-slate-400">Loading…</div>}
      {data && <PriorityList zones={data} />}
    </div>
  );
}
