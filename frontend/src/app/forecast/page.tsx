"use client";
import { ForecastChart } from "@/components/ForecastChart";
import { StatCard } from "@/components/StatCard";
import { useForecast } from "@/hooks/useApi";

export default function ForecastPage() {
  const { data, isLoading } = useForecast();
  const metrics = (data?.metrics ?? {}) as Record<string, number | string>;

  return (
    <div className="p-10 overflow-y-auto flex-1 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Congestion Impact</div>
        <h1 className="font-sans text-headline-lg text-foreground uppercase tracking-tight">Congestion_Impact</h1>
        <p className="font-sans text-body-md text-muted mt-2">
          LightGBM next-window hotspot risk probability forecast · temporal holdout validation
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        <StatCard
          label="Model_Backend"
          value={String(metrics.backend ?? "—").toUpperCase()}
        />
        <StatCard
          label="AUC-ROC"
          value={metrics.auc_roc ?? "—"}
          sub="Model discrimination"
        />
        <StatCard
          label="F1_Score"
          value={metrics.f1 ?? "—"}
        />
        <StatCard
          label="RMSE"
          value={metrics.rmse ?? "—"}
        />
      </div>

      {/* Chart */}
      {isLoading && (
        <div className="border border-border flex items-center justify-center h-[400px]">
          <div className="font-mono text-label-md text-muted uppercase animate-pulse-soft">Loading_forecast_data…</div>
        </div>
      )}
      {data?.points?.length ? (
        <ForecastChart points={data.points} />
      ) : (
        !isLoading && (
          <div className="border border-border flex items-center justify-center h-[400px]">
            <div className="font-mono text-label-md text-muted uppercase">No_forecast_data_available</div>
          </div>
        )
      )}
    </div>
  );
}
