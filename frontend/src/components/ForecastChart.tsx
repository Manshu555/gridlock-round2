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
      <div className="text-xs font-mono uppercase tracking-wider text-neon-cyan/80 mb-3">
        ◹ Forecast vs. actual — city-wide daily violations (holdout)
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(34,211,238,0.10)" />
          <XAxis dataKey="date" stroke="#5b7aa0" fontSize={11} />
          <YAxis stroke="#5b7aa0" fontSize={11} />
          <Tooltip
            contentStyle={{
              background: "rgba(10,16,32,0.95)",
              border: "1px solid rgba(34,211,238,0.4)",
              borderRadius: 8,
              boxShadow: "0 0 16px rgba(34,211,238,0.3)",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#22d3ee"
            dot={false}
            strokeWidth={2}
            style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.8))" }}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#ff2bd6"
            dot={false}
            strokeWidth={2}
            strokeDasharray="5 3"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,43,214,0.8))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
