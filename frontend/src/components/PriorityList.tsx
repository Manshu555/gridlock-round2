"use client";
import type { PriorityZone } from "@/lib/types";

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return <span className="text-slate-500">—</span>;

  if (category.includes("99%")) {
    return (
      <span className="badge badge-hot">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 animate-pulse-soft" />
        {category}
      </span>
    );
  }
  if (category.includes("95%")) {
    return (
      <span className="badge badge-warm">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
        {category}
      </span>
    );
  }
  return <span className="badge badge-neutral">{category}</span>;
}

export function PriorityList({ zones }: { zones: PriorityZone[] }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th className="w-16">Rank</th>
              <th>Police Station</th>
              <th>H3 Cell</th>
              <th className="text-right">EPS</th>
              <th className="text-right">PCII</th>
              <th className="text-right">Violations</th>
              <th>Road</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((z, idx) => (
              <tr
                key={z.h3}
                className="animate-enter"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <td>
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/10 text-accent font-semibold text-sm">
                    {z.priority_rank}
                  </div>
                </td>
                <td className="font-medium text-white">{z.police_station ?? "—"}</td>
                <td>
                  <code className="font-mono text-[11px] text-slate-500 bg-surface px-2 py-1 rounded-md">
                    {z.h3}
                  </code>
                </td>
                <td className="text-right">
                  <span className="font-semibold text-white">{z.eps?.toFixed(1)}</span>
                </td>
                <td className="text-right text-slate-300">{z.pcii?.toFixed(1)}</td>
                <td className="text-right text-slate-300">{z.violations?.toLocaleString()}</td>
                <td className="text-slate-400">{z.road_class ?? "—"}</td>
                <td>
                  <CategoryBadge category={z.hotspot_category} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
