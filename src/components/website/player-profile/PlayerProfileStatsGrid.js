function ProfileStat({ label, value }) {
  return (
    <div className="flex min-h-32 flex-col justify-center rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
        {label}
      </p>
      <div className="mt-3 break-words text-2xl font-black leading-tight text-white">
        {value || "-"}
      </div>
    </div>
  );
}

export default function PlayerProfileStatsGrid({ stats = [] }) {
  return (
    <div className="grid flex-1 auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {stats.map((item) => (
        <ProfileStat key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  );
}
