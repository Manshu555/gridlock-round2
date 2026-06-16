"use client";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAnalytics } from "@/hooks/useApi";

function toBars(obj: Record<string, number> = {}, n = 10) {
  return Object.entries(obj)
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

export default function AnalyticsPage() {
  const { data, isLoading } = useAnalytics();
  const profile = data?.data_profile ?? {};

  const violationTypes = toBars(profile.violation_type_counts);
  const stations = toBars(profile.police_station_counts);
  const monthly = toBars(profile.monthly_counts, 24);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white tracking-tight">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Descriptive statistics from the violation dataset
        </p>
      </div>

      {isLoading && (
        <div className="card flex items-center justify-center h-[200px]">
          <div className="text-slate-400 animate-pulse-soft">Loading analytics…</div>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-6">
          <Chart title="Top Violation Types" data={violationTypes} />
          <Chart title="Top Police Stations (Enforcement Zones)" data={stations} />
          <Chart title="Monthly Violation Volume" data={monthly} />
        </div>
      )}
    </div>
  );
}

function Chart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="card">
      <div className="mb-4">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-slate-500 mt-1">{data.length} categories</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
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
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          <Bar
            dataKey="value"
            fill="#3b82f6"
            fillOpacity={0.8}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
