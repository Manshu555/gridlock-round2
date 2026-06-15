"use client";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";

import { useSimulation } from "@/hooks/useApi";

export function SimulatorPanel() {
  const [k, setK] = useState(5);
  const [compliance, setCompliance] = useState(0.85);
  const { data, isLoading, error } = useSimulation(k, compliance);

  const chart = data
    ? [
        { name: "Before", value: data.city_impact_before },
        { name: "After", value: data.city_impact_after },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card lg:col-span-1 space-y-5">
        <div>
          <label className="text-sm text-slate-300">
            Enforce top-K zones: <span className="text-accent font-semibold">{k}</span>
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300">
            Compliance factor:{" "}
            <span className="text-accent font-semibold">{compliance.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={compliance}
            onChange={(e) => setCompliance(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
        </div>
        {data && (
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs uppercase text-slate-400">Projected impact reduction</div>
            <div className="text-4xl font-bold text-cool mt-1">
              {data.reduction_pct.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400 mt-2">
              {data.violations_addressed.toLocaleString()} violations addressed across{" "}
              {data.cells_cleared} zones
            </div>
          </div>
        )}
      </div>

      <div className="card lg:col-span-2">
        <div className="text-sm text-slate-300 mb-3">City-wide congestion-impact: before vs. after</div>
        {isLoading && <div className="text-slate-400">Computing…</div>}
        {error && <div className="text-hot">Failed to load simulation.</div>}
        {data && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#121826", border: "1px solid #1e293b" }} />
              <Bar dataKey="value">
                <Cell fill="#ef4444" />
                <Cell fill="#22c55e" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
