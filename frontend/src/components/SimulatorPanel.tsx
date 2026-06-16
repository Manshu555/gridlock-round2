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
        { name: "Before", value: data.city_impact_before, fill: "#ef4444" },
        { name: "After", value: data.city_impact_after, fill: "#22c55e" },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Controls Panel */}
      <div className="card space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white">Top-K Zones</label>
            <span className="text-accent font-semibold text-lg">{k}</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white">Compliance Factor</label>
            <span className="text-accent font-semibold text-lg">{compliance.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={compliance}
            onChange={(e) => setCompliance(Number(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
            <span>0.1</span>
            <span>1.0</span>
          </div>
        </div>

        {data && (
          <div className="pt-5 border-t border-white/[0.06]">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium mb-2">
              Projected Impact Reduction
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-500">
                {data.reduction_pct.toFixed(1)}
              </span>
              <span className="text-2xl text-emerald-400 font-semibold">%</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
              {data.violations_addressed.toLocaleString()} violations across {data.cells_cleared} zones
            </div>
          </div>
        )}
      </div>

      {/* Chart Panel */}
      <div className="card lg:col-span-2">
        <div className="mb-4">
          <div className="text-sm font-medium text-white">City-wide Congestion Impact</div>
          <div className="text-xs text-slate-500 mt-1">Before vs. after enforcement simulation</div>
        </div>

        {isLoading && (
          <div className="h-[280px] flex items-center justify-center text-slate-400">
            <div className="animate-pulse-soft">Computing simulation…</div>
          </div>
        )}
        {error && (
          <div className="h-[280px] flex items-center justify-center text-red-400">
            Failed to load simulation
          </div>
        )}
        {data && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} barSize={80}>
              <XAxis
                dataKey="name"
                stroke="#475569"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              />
              <YAxis
                stroke="#475569"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
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
                formatter={(value: number) => [value.toLocaleString(), 'Impact']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                <Cell fill="#ef4444" fillOpacity={0.8} />
                <Cell fill="#22c55e" fillOpacity={0.8} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
