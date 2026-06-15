export function StatCard({
  label,
  value,
  sub,
  accent = "cyan",
  pulse = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "cyan" | "magenta" | "violet" | "lime";
  pulse?: boolean;
}) {
  const ring: Record<string, string> = {
    cyan: "from-neon-cyan",
    magenta: "from-neon-magenta",
    violet: "from-neon-violet",
    lime: "from-neon-lime",
  };
  const text: Record<string, string> = {
    cyan: "text-neon-cyan",
    magenta: "text-neon-magenta",
    violet: "text-neon-violet",
    lime: "text-neon-lime",
  };
  const shadow: Record<string, string> = {
    cyan: "0 0 10px rgba(34,211,238,0.65)",
    magenta: "0 0 10px rgba(255,43,214,0.65)",
    violet: "0 0 10px rgba(168,85,247,0.65)",
    lime: "0 0 10px rgba(173,255,47,0.65)",
  };
  return (
    <div className="card relative overflow-hidden">
      <div className={`absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r ${ring[accent]} to-transparent`} />
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 font-mono">{label}</div>
      <div
        className={`mt-1 text-3xl font-bold font-mono ${text[accent]} ${pulse ? "animate-pulse-glow" : ""}`}
        style={{ textShadow: shadow[accent] }}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1 font-mono">{sub}</div>}
    </div>
  );
}
