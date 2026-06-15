"use client";
import type { PriorityZone } from "@/lib/types";

function badge(cat?: string) {
  if (!cat) return "text-slate-400";
  if (cat.includes("99")) return "text-hot";
  if (cat.includes("95")) return "text-warm";
  return "text-slate-300";
}

export function PriorityList({ zones }: { zones: PriorityZone[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="data">
        <thead>
          <tr>
            <th>#</th>
            <th>Police Station</th>
            <th>H3 Cell</th>
            <th>EPS</th>
            <th>PCII</th>
            <th>Violations</th>
            <th>Road</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.h3}>
              <td className="text-accent font-semibold">{z.priority_rank}</td>
              <td>{z.police_station ?? "—"}</td>
              <td className="font-mono text-xs text-slate-400">{z.h3}</td>
              <td className="font-semibold">{z.eps?.toFixed(1)}</td>
              <td>{z.pcii?.toFixed(1)}</td>
              <td>{z.violations?.toLocaleString()}</td>
              <td className="text-slate-400">{z.road_class ?? "—"}</td>
              <td className={badge(z.hotspot_category)}>{z.hotspot_category ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
