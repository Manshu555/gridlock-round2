"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ForecastPoint } from "@/lib/types";

export function ForecastChart({ points }: { points: ForecastPoint[] }) {
  // aggregate by date across cells for a city-level view
  const byDate = new Map<string, { date: string; actual: number; predicted: number }>();
  for (const p of points) {
    const d = p.date.slice(0, 10);
    const e = byDate.get(d) ?? { date: d, actual: 0, predicted: 0 };
    e.actual += p.violations;
    e.predicted += p.prediction;
    byDate.set(d, e);
  }
  const data = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="border border-border bg-background p-6">
      <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
        <div>
          <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-1">Forecast_vs_Actual</div>
          <div className="font-sans text-body-sm text-muted">City-wide daily violations · holdout period</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-foreground"></div>
            <span className="font-mono text-label-sm text-muted uppercase">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-px bg-neon border-dashed border-t border-neon"></div>
            <span className="font-mono text-label-sm text-neon uppercase">Predicted</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#444444"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={{ stroke: '#333333' }}
          />
          <YAxis
            stroke="#444444"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0A0A0A',
              border: '1px solid #222222',
              borderRadius: '0px',
              padding: '12px 16px',
              fontFamily: 'monospace',
            }}
            labelStyle={{ color: '#666666', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
            itemStyle={{ color: '#fff', fontFamily: 'monospace' }}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#FF3B00"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            name="Predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
