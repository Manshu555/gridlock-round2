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
    <div className="p-10 overflow-y-auto flex-1 space-y-10">
      {/* Header */}
      <div className="border-b border-border pb-8">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-2">Module / Analytics</div>
        <h1 className="font-sans text-headline-lg text-foreground uppercase tracking-tight">Analytics_</h1>
        <p className="font-sans text-body-md text-muted mt-2">
          Descriptive statistics from the violation dataset
        </p>
      </div>

      {isLoading && (
        <div className="border border-border flex items-center justify-center h-[200px]">
          <div className="font-mono text-label-md text-muted uppercase animate-pulse-soft">Loading_analytics…</div>
        </div>
      )}

      {!isLoading && (
        <div className="grid gap-px bg-border border border-border">
          <Chart title="Violation_Types" data={violationTypes} />
          <Chart title="Police_Stations" data={stations} />
          <Chart title="Monthly_Volume" data={monthly} />
        </div>
      )}
    </div>
  );
}

function Chart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="bg-background p-6">
      <div className="mb-6 border-b border-border pb-6 flex items-end justify-between">
        <div className="font-mono text-label-md text-muted uppercase tracking-widest">{title}</div>
        <div className="font-mono text-label-sm text-muted">{data.length}_categories</div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid
            stroke="rgba(255,255,255,0.04)"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="#444444"
            fontSize={11}
            fontFamily="monospace"
            tickLine={false}
            axisLine={{ stroke: '#333333' }}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
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
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          <Bar
            dataKey="value"
            fill="#FF3B00"
            fillOpacity={0.8}
            radius={[0, 0, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
