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
    <div className="bg-background border border-border p-6 flex flex-col justify-between">
      <div className="font-mono text-label-md text-muted uppercase tracking-widest mb-4">
        {label}
      </div>
      <div className="font-mono text-display-massive text-neon tracking-tighter leading-none">
        {value}
      </div>
      {sub && (
        <div className="font-sans text-label-md text-muted mt-4 uppercase tracking-widest flex items-center">
          <span className="w-1.5 h-1.5 bg-border mr-2"></span>
          {sub}
        </div>
      )}
    </div>
  );
}
