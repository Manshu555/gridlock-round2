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
    <div className="card">
      <div className="mb-4">
        <div className="text-sm font-medium text-white">Forecast vs. Actual</div>
        <div className="text-xs text-slate-500 mt-1">City-wide daily violations, holdout period</div>
      </div>
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <YAxis
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}
            labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            name="Actual"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={false}
            name="Predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
