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
      <div className="text-sm text-slate-300 mb-3">
        Forecast vs. actual (city-wide daily violations, holdout period)
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} />
          <Tooltip contentStyle={{ background: "#121826", border: "1px solid #1e293b" }} />
          <Legend />
          <Line type="monotone" dataKey="actual" stroke="#38bdf8" dot={false} strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
