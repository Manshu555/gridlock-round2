"use client";
import { SimulatorPanel } from "@/components/SimulatorPanel";

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">What-If Enforcement Simulator</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Clear the top-K priority zones and see the projected reduction in city-wide congestion impact
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-slate-600 bg-surface px-3 py-1.5 rounded-lg border border-white/[0.06]">
          CityImpact = <span className="text-slate-400">Σ PCII · violations</span>
        </div>
      </div>

      <SimulatorPanel />
    </div>
  );
}
