"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/hotspots", label: "Hotspots" },
  { href: "/forecast", label: "Forecast" },
  { href: "/priorities", label: "Priority Zones" },
  { href: "/simulator", label: "Simulator" },
  { href: "/analytics", label: "Analytics" },
];

export function Nav() {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 bg-panel border-r border-slate-800 min-h-screen p-4">
      <div className="text-xl font-bold mb-1">🚦 Gridlock</div>
      <div className="text-xs text-slate-500 mb-6">Parking Intelligence</div>
      <nav className="space-y-1">
        {LINKS.map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2 text-sm ${
                active ? "bg-accent/20 text-accent" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
