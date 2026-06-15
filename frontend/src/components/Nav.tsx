"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "▣" },
  { href: "/hotspots", label: "Hotspots", icon: "◎" },
  { href: "/forecast", label: "Forecast", icon: "◹" },
  { href: "/priorities", label: "Priority Zones", icon: "≡" },
  { href: "/simulator", label: "Simulator", icon: "⟳" },
  { href: "/analytics", label: "Analytics", icon: "▤" },
];

export function Nav() {
  const path = usePathname();
  return (
    <aside className="w-60 shrink-0 min-h-screen p-4 border-r border-neon-cyan/20 bg-[rgba(6,9,18,0.85)] backdrop-blur-md sticky top-0 self-start">
      <div className="px-2 mb-1">
        <div className="font-display text-2xl font-black tracking-widest text-neon-cyan neon">
          ▣ GRIDLOCK
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-neon-magenta/80 mt-1">
          Smart-City Intel
        </div>
      </div>

      <div className="h-px my-4 bg-gradient-to-r from-neon-cyan/60 via-neon-violet/40 to-transparent" />

      <nav className="space-y-1.5">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider transition-all border-l-2 ${
                active
                  ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-cyan"
                  : "border-transparent text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/5 hover:border-neon-cyan/40"
              }`}
            >
              <span className={active ? "neon" : ""}>{l.icon}</span>
              <span>{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-4 right-4">
        <div className="h-px mb-3 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-neon-lime">
          <span className="inline-block h-2 w-2 rounded-full bg-neon-lime shadow-[0_0_8px_#adff2f] animate-pulse-glow" />
          System Online
        </div>
        <div className="text-[10px] text-slate-600 font-mono mt-1">v1.0.0 · BLR-GRID</div>
      </div>
    </aside>
  );
}
