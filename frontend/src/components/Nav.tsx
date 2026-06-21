"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Overview", icon: "dashboard" },
  { href: "/hotspots", label: "Hotspot Detection", icon: "location_on" },
  { href: "/forecast", label: "Congestion Impact", icon: "traffic" },
  { href: "/priorities", label: "Enforcement Ranking", icon: "gavel" },
  { href: "/simulator", label: "Simulator", icon: "model_training" },
];

export function Nav() {
  const path = usePathname();
  
  return (
    <nav className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col py-6 px-0 z-40 bg-background border-r border-border">
      <div className="flex-1 space-y-0 mt-8">
        {LINKS.map((l) => {
          const active = path === l.href || (path === "/" && l.href === "/hotspots");
          
          if (active) {
            return (
              <Link key={l.href} href={l.href} className="flex items-center space-x-3 px-6 py-3 border-l-2 border-neon bg-surface text-foreground transition-all duration-200">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>{l.icon}</span>
                <span className="font-mono text-label-md uppercase tracking-wider">{l.label}</span>
              </Link>
            );
          }
          
          return (
            <Link key={l.href} href={l.href} className="flex items-center space-x-3 px-6 py-3 border-l-2 border-transparent text-muted hover:text-foreground hover:bg-surface transition-all group">
              <span className="material-symbols-outlined text-[18px] group-hover:text-foreground">{l.icon}</span>
              <span className="font-mono text-label-md uppercase tracking-wider">{l.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto space-y-0 pt-4 border-t border-border">
        <Link href="/analytics" className="flex items-center space-x-3 px-6 py-3 border-l-2 border-transparent text-muted hover:text-foreground hover:bg-surface transition-all group">
          <span className="material-symbols-outlined text-[18px] group-hover:text-foreground">analytics</span>
          <span className="font-mono text-label-md uppercase tracking-wider">System Status</span>
        </Link>
        <Link href="/help" className="flex items-center space-x-3 px-6 py-3 border-l-2 border-transparent text-muted hover:text-foreground hover:bg-surface transition-all group">
          <span className="material-symbols-outlined text-[18px] group-hover:text-foreground">help</span>
          <span className="font-mono text-label-md uppercase tracking-wider">Help</span>
        </Link>
      </div>
    </nav>
  );
}
