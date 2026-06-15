export function PageHeader({
  title,
  subtitle,
  tag,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
}) {
  return (
    <div className="mb-2">
      {tag && (
        <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-neon-magenta/90 mb-1">
          ▰ {tag}
        </div>
      )}
      <h1 className="hud-title">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm mt-1 max-w-3xl">{subtitle}</p>}
      <div className="h-px mt-3 bg-gradient-to-r from-neon-cyan/70 via-neon-violet/40 to-transparent" />
    </div>
  );
}
