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
        { name: "Before", value: data.city_impact_before, fill: "#ffffff" },
        { name: "After", value: data.city_impact_after, fill: "#FF3B00" },
      ]
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-border border border-border">
      {/* Controls Panel */}
      <div className="bg-background p-8 space-y-8">
        <div className="border-b border-border pb-8">
          <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-6">Parameters</div>

          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono text-label-md text-muted uppercase tracking-widest">Top-K Zones</label>
                <span className="font-mono text-headline-lg text-neon">{k}</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-full accent-neon bg-border h-px appearance-none cursor-pointer"
                style={{ WebkitAppearance: 'none', accentColor: '#FF3B00' }}
              />
              <div className="flex justify-between font-mono text-label-sm text-muted mt-2">
                <span>01</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-mono text-label-md text-muted uppercase tracking-widest">Compliance</label>
                <span className="font-mono text-headline-lg text-neon">{compliance.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={compliance}
                onChange={(e) => setCompliance(Number(e.target.value))}
                className="w-full h-px appearance-none cursor-pointer"
                style={{ WebkitAppearance: 'none', accentColor: '#FF3B00' }}
              />
              <div className="flex justify-between font-mono text-label-sm text-muted mt-2">
                <span>0.1</span>
                <span>1.0</span>
              </div>
            </div>
          </div>
        </div>

        {data && (
          <div>
            <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-4">
              Impact_Reduction
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-display-massive text-neon tracking-tighter">
                {data.reduction_pct.toFixed(1)}
              </span>
              <span className="font-mono text-headline-md text-neon">%</span>
            </div>
            <div className="mt-4 font-sans text-body-sm text-muted uppercase">
              {data.violations_addressed.toLocaleString()} violations · {data.cells_cleared} zones
            </div>
          </div>
        )}
      </div>

      {/* Chart Panel */}
      <div className="bg-background p-8 lg:col-span-2">
        <div className="mb-6 border-b border-border pb-6">
          <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-1">City_Impact_Simulation</div>
          <div className="font-sans text-body-sm text-muted">Before vs. after enforcement deployment</div>
        </div>

        {isLoading && (
          <div className="h-[280px] flex items-center justify-center">
            <div className="font-mono text-label-md text-muted uppercase animate-pulse-soft">Computing_simulation…</div>
          </div>
        )}
        {error && (
          <div className="h-[280px] flex items-center justify-center">
            <div className="font-mono text-label-md text-neon uppercase">Error: Failed_to_load</div>
          </div>
        )}
        {data && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chart} barSize={60}>
              <XAxis
                dataKey="name"
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
                tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
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
                formatter={(value: number) => [value.toLocaleString(), 'Impact']}
              />
              <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                <Cell fill="#ffffff" fillOpacity={0.6} />
                <Cell fill="#FF3B00" fillOpacity={0.9} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
