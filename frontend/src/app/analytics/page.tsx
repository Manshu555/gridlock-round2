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

import { PageHeader } from "@/components/PageHeader";
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
    <div className="space-y-6">
      <PageHeader
        tag="Telemetry"
        title="Analytics"
        subtitle="Descriptive statistics from the violation dataset."
      />
      {isLoading && <div className="text-slate-400 font-mono">Loading…</div>}

      <Chart title="Top violation types" data={violationTypes} />
      <Chart title="Top police stations (enforcement zones)" data={stations} />
      <Chart title="Monthly violation volume" data={monthly} />
    </div>
  );
}

function Chart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="card">
      <div className="text-xs font-mono uppercase tracking-wider text-neon-cyan/80 mb-3">▤ {title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke="rgba(34,211,238,0.10)" />
          <XAxis type="number" stroke="#5b7aa0" fontSize={11} />
          <YAxis type="category" dataKey="name" width={150} stroke="#5b7aa0" fontSize={10} />
          <Tooltip
            cursor={{ fill: "rgba(34,211,238,0.06)" }}
            contentStyle={{
              background: "rgba(10,16,32,0.95)",
              border: "1px solid rgba(34,211,238,0.4)",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
