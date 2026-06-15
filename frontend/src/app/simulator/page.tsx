"use client";
import { PageHeader } from "@/components/PageHeader";
import { SimulatorPanel } from "@/components/SimulatorPanel";

export default function SimulatorPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        tag="Digital Twin"
        title="What-If Enforcement Simulator"
        subtitle="Clear the top-K priority zones and see the projected reduction in city-wide congestion impact. CityImpact = Σ PCII · violations."
      />
      <SimulatorPanel />
    </div>
  );
}
