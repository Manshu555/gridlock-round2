"use client";
import type { PriorityZone } from "@/lib/types";

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return <span className="font-mono text-muted text-label-sm uppercase">—</span>;

  if (category.includes("99%")) {
    return (
      <span className="inline-flex items-center font-mono text-label-sm uppercase tracking-widest text-background bg-neon px-2 py-1">
        <div className="w-1.5 h-1.5 bg-background mr-2 animate-ping" />
        {category}
      </span>
    );
  }
  if (category.includes("95%")) {
    return (
      <span className="inline-flex items-center font-mono text-label-sm uppercase tracking-widest text-foreground border border-border px-2 py-1">
        <div className="w-1.5 h-1.5 bg-muted mr-2" />
        {category}
      </span>
    );
  }
  return <span className="font-mono text-label-sm uppercase tracking-widest text-muted">{category}</span>;
}

export function PriorityList({ zones }: { zones: PriorityZone[] }) {
  return (
    <div className="border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm font-sans">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal w-16">Rank</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal">Police_Station</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal">H3_Cell</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal text-right">EPS</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal text-right">PCII</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal text-right">Violations</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal">Road</th>
              <th className="font-mono text-label-sm text-muted uppercase tracking-widest py-4 px-6 font-normal">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {zones.map((z, idx) => (
              <tr
                key={z.h3}
                className="hover:bg-surface transition-colors"
              >
                <td className="py-4 px-6">
                  <div className="font-mono text-label-md text-neon">
                    #{z.priority_rank}
                  </div>
                </td>
                <td className="py-4 px-6 font-sans text-foreground uppercase">{z.police_station ?? "—"}</td>
                <td className="py-4 px-6">
                  <code className="font-mono text-label-sm text-muted">
                    {z.h3}
                  </code>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="font-mono text-body-md text-foreground">{z.eps?.toFixed(1)}</span>
                </td>
                <td className="py-4 px-6 text-right font-mono text-body-md text-muted">{z.pcii?.toFixed(1)}</td>
                <td className="py-4 px-6 text-right font-mono text-body-md text-muted">{z.violations?.toLocaleString()}</td>
                <td className="py-4 px-6 font-sans text-muted uppercase">{z.road_class ?? "—"}</td>
                <td className="py-4 px-6">
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
