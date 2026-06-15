"use client";
import { ForecastChart } from "@/components/ForecastChart";
import { StatCard } from "@/components/StatCard";
import { useForecast } from "@/hooks/useApi";

export default function ForecastPage() {
  const { data, isLoading } = useForecast();
  const metrics = (data?.metrics ?? {}) as Record<string, number | string>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hotspot Forecast</h1>
        <p className="text-slate-400 text-sm">
          LightGBM next-window violation-intensity forecast (temporal holdout).
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Model" value={String(metrics.backend ?? "—")} />
        <StatCard label="MAE" value={metrics.mae ?? "—"} />
        <StatCard label="RMSE" value={metrics.rmse ?? "—"} />
        <StatCard label="MASE" value={metrics.mase_vs_seasonal_naive ?? "—"} sub="< 1 beats naïve" />
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
