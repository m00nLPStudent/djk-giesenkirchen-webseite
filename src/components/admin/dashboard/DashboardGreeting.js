function formatGeneratedAt(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(value));
}

export default function DashboardGreeting({ greeting, generatedAt }) {
  const title = greeting.displayName ? `${greeting.text}, ${greeting.displayName}` : greeting.text;
  return (
    <header className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">Arbeitsübersicht</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">{greeting.intro}</p>
      </div>
      {generatedAt ? <time dateTime={generatedAt} className="shrink-0 text-xs text-white/40">Stand: {formatGeneratedAt(generatedAt)}</time> : null}
    </header>
  );
}
