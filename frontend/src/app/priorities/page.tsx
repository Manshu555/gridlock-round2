"use client";
import { PriorityList } from "@/components/PriorityList";
import { usePriorityZones } from "@/hooks/useApi";

export default function PrioritiesPage() {
  const { data, isLoading } = usePriorityZones(100);

  return (
    <div className="p-10 overflow-y-auto flex-1 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Enforcement</div>
        <h1 className="font-sans text-headline-lg text-foreground uppercase tracking-tight">Priority_Zones</h1>
        <p className="font-sans text-body-md text-muted mt-2">
          Ranked by EPS = 0.5·PCII + 0.3·violation-frequency + 0.2·road-criticality
        </p>
      </div>

      {/* Table */}
      {isLoading && (
        <div className="border border-border flex items-center justify-center h-[400px]">
          <div className="font-mono text-label-md text-muted uppercase animate-pulse-soft">Loading_priority_zones…</div>
        </div>
      )}
      {data && <PriorityList zones={data} />}
    </div>
  );
}
