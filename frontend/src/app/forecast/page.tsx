"use client";
import { ForecastChart } from "@/components/ForecastChart";
import { StatCard } from "@/components/StatCard";
import { useForecast } from "@/hooks/useApi";

export default function ForecastPage() {
  const { data, isLoading } = useForecast();
  const metrics = (data?.metrics ?? {}) as Record<string, number | string>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Hotspot Forecast</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          LightGBM next-window violation-intensity forecast with temporal holdout validation
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Model Backend"
          value={String(metrics.backend ?? "—").toUpperCase()}
        />
        <StatCard
          label="Mean Absolute Error"
          value={metrics.mae ?? "—"}
        />
        <StatCard
          label="Root Mean Square Error"
          value={metrics.rmse ?? "—"}
        />
        <StatCard
          label="MASE Score"
          value={metrics.mase_vs_seasonal_naive ?? "—"}
          sub="< 1 beats seasonal naïve"
        />
      </div>

      {/* Chart */}
      {isLoading && (
        <div className="card flex items-center justify-center h-[400px]">
          <div className="text-slate-400 animate-pulse-soft">Loading forecast data…</div>
        </div>
      )}
      {data?.points?.length ? (
        <ForecastChart points={data.points} />
      ) : (
        !isLoading && (
          <div className="card flex items-center justify-center h-[400px]">
            <div className="text-slate-500">No forecast data available</div>
          </div>
        )
      )}
    </div>
  );
}
