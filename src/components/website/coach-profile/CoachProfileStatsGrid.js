function StatCard({ label, value, href }) {
  const content = (
    <div className="flex min-h-32 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-red-500/50">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <div className="mt-3 break-words text-2xl font-black leading-tight text-white">
        {value || "-"}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a href={href} className="block">
      {content}
    </a>
  );
}

export default function CoachProfileStatsGrid({ stats = [] }) {
  return (
    <div className="grid flex-1 auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <StatCard key={item.label} {...item} />
      ))}
    </div>
  );
}
