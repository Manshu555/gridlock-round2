"use client";
import { PageHeader } from "@/components/PageHeader";
import { PriorityList } from "@/components/PriorityList";
import { usePriorityZones } from "@/hooks/useApi";

export default function PrioritiesPage() {
  const { data, isLoading } = usePriorityZones(100);
  return (
    <div className="space-y-4">
      <PageHeader
        tag="Deployment Queue"
        title="Enforcement Priority Zones"
        subtitle="Ranked by EPS = 0.5·PCII + 0.3·violation-frequency + 0.2·road-criticality."
      />
      {isLoading && <div className="text-slate-400">Loading…</div>}
      {data && <PriorityList zones={data} />}
    </div>
  );
}
