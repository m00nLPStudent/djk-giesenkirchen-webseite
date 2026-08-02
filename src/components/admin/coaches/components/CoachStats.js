export default function CoachStats({ coaches = [] }) {
  const active = coaches.filter((coach) => coach.isActive).length;
  const stats = [["Trainer gesamt", coaches.length], ["Aktiv", active], ["Inaktiv", coaches.length - active]];
  return <dl className="flex flex-wrap gap-2.5">{stats.map(([label, value]) => <div key={label} className="inline-flex items-baseline gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/45">{label}</dt><dd className="text-sm font-black text-white">{value}</dd></div>)}</dl>;
}
