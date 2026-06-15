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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-slate-400 text-sm">Descriptive statistics from the violation dataset.</p>
      </div>
      {isLoading && <div className="text-slate-400">Loading…</div>}

      <Chart title="Top violation types" data={violationTypes} />
      <Chart title="Top police stations (enforcement zones)" data={stations} />
      <Chart title="Monthly violation volume" data={monthly} />
    </div>
  );
}

function Chart({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-300 mb-3">{title}</div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis type="number" stroke="#64748b" fontSize={11} />
          <YAxis type="category" dataKey="name" width={150} stroke="#64748b" fontSize={10} />
          <Tooltip contentStyle={{ background: "#121826", border: "1px solid #1e293b" }} />
          <Bar dataKey="value" fill="#38bdf8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
