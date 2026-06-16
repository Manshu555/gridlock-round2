export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.1em] text-slate-500 font-medium">{label}</div>
        <div className="w-1.5 h-1.5 rounded-full bg-accent/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="stat">{value}</div>
      {sub && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-slate-600" />
          {sub}
        </div>
      )}
    </div>
  );
}
