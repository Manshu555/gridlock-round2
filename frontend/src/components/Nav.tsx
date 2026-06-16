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
    <aside className="w-60 shrink-0 min-h-screen relative">
      {/* Glassmorphic background */}
      <div className="sticky top-0 h-screen overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent border-r border-white/[0.06]" />
        <div className="relative p-5">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-glow-accent">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-semibold tracking-tight text-white">Gridlock</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Parking Intelligence</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {LINKS.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {l.label}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
