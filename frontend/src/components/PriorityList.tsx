"use client";
import type { PriorityZone } from "@/lib/types";

function catColor(cat?: string) {
  if (!cat) return "text-slate-400";
  if (cat.includes("99")) return "neon-magenta";
  if (cat.includes("95")) return "text-neon-amber";
  if (cat.includes("90")) return "text-neon-violet";
  return "text-slate-400";
}

function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-xs font-bold ${
        top
          ? "text-neon-magenta border border-neon-magenta/50"
          : "text-neon-cyan border border-neon-cyan/30"
      }`}
      style={top ? { boxShadow: "0 0 10px rgba(255,43,214,0.5)" } : undefined}
    >
      {rank}
    </span>
  );
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
              <td><RankBadge rank={z.priority_rank} /></td>
              <td className="text-[#dbe9ff]">{z.police_station ?? "—"}</td>
              <td className="text-[11px] text-slate-500">{z.h3}</td>
              <td className="font-bold text-neon-cyan" style={{ textShadow: "0 0 8px rgba(34,211,238,0.5)" }}>
                {z.eps?.toFixed(1)}
              </td>
              <td>{z.pcii?.toFixed(1)}</td>
              <td>{z.violations?.toLocaleString()}</td>
              <td className="text-slate-400">{z.road_class ?? "—"}</td>
              <td className={catColor(z.hotspot_category)}>{z.hotspot_category ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
