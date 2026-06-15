"use client";
import { SimulatorPanel } from "@/components/SimulatorPanel";

export default function SimulatorPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">What-If Enforcement Simulator</h1>
        <p className="text-slate-400 text-sm">
          Clear the top-K priority zones and see the projected reduction in city-wide
          congestion impact. CityImpact = Σ PCII · violations.
        </p>
      </div>
      <SimulatorPanel />
    </div>
  );
}
