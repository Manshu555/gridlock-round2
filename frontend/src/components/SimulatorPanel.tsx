"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
          <div className="pt-3 border-t border-neon-cyan/20">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Projected impact reduction
            </div>
            <div
              className="text-5xl font-bold font-mono text-neon-lime mt-1 animate-pulse-glow"
              style={{ textShadow: "0 0 16px rgba(173,255,47,0.7)" }}
            >
              {data.reduction_pct.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400 mt-2 font-mono">
              {data.violations_addressed.toLocaleString()} violations addressed across{" "}
              {data.cells_cleared} zones
            </div>
          </div>
        )}
      </div>

      <div className="card lg:col-span-2">
        <div className="text-xs font-mono uppercase tracking-wider text-neon-cyan/80 mb-3">
          ⟳ City-wide congestion impact — before vs. after enforcement
        </div>
        {isLoading && <div className="text-slate-400 font-mono">Computing…</div>}
        {error && <div className="neon-magenta font-mono">Failed to load simulation.</div>}
        {data && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid stroke="rgba(34,211,238,0.10)" />
              <XAxis dataKey="name" stroke="#5b7aa0" fontSize={12} />
              <YAxis stroke="#5b7aa0" fontSize={11} />
              <Tooltip
                cursor={{ fill: "rgba(34,211,238,0.06)" }}
                contentStyle={{
                  background: "rgba(10,16,32,0.95)",
                  border: "1px solid rgba(34,211,238,0.4)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                <Cell fill="#ff2bd6" />
                <Cell fill="#adff2f" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
