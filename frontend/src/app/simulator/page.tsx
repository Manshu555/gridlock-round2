"use client";
import { SimulatorPanel } from "@/components/SimulatorPanel";

export default function SimulatorPage() {
  return (
    <div className="p-10 overflow-y-auto flex-1 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Simulator</div>
        <h1 className="font-sans text-headline-lg text-foreground uppercase tracking-tight">Enforcement_Simulator</h1>
        <p className="font-sans text-body-md text-muted mt-2">
          Clear the top-K priority zones and see the projected reduction in city-wide congestion impact
        </p>
        <div className="mt-4 inline-flex items-center gap-3 font-mono text-label-md text-muted border border-border px-4 py-2">
          <span className="text-foreground">CityImpact</span>
          <span className="text-neon">=</span>
          <span>Σ PCII · violations</span>
        </div>
      </div>

      <SimulatorPanel />
    </div>
  );
}
