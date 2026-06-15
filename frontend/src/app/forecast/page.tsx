"use client";
import { ForecastChart } from "@/components/ForecastChart";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { useForecast } from "@/hooks/useApi";

export default function ForecastPage() {
  const { data, isLoading } = useForecast();
  const metrics = (data?.metrics ?? {}) as Record<string, number | string>;

  return (
    <div className="space-y-6">
      <PageHeader
        tag="Predictive Engine"
        title="Hotspot Forecast"
        subtitle="LightGBM next-window violation-intensity forecast (temporal holdout)."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Model" value={String(metrics.backend ?? "—")} accent="violet" />
        <StatCard label="MAE" value={metrics.mae ?? "—"} accent="cyan" />
        <StatCard label="RMSE" value={metrics.rmse ?? "—"} accent="cyan" />
        <StatCard label="MASE" value={metrics.mase_vs_seasonal_naive ?? "—"} sub="< 1 beats naïve" accent="lime" pulse />
      </div>

      {isLoading && <div className="text-slate-400">Loading forecast…</div>}
      {data?.points?.length ? (
        <ForecastChart points={data.points} />
      ) : (
        !isLoading && <div className="card text-slate-400">No forecast data available.</div>
      )}
    </div>
  );
}
