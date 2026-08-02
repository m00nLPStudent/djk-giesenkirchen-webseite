import Link from "next/link";

const date = (value) => new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(value));
const time = (value) => new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(value));

export default function DashboardUpcomingList({ events }) {
  return <section aria-labelledby="dashboard-events" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
    <div className="flex items-center justify-between"><h2 id="dashboard-events" className="font-black">Anstehende Termine</h2><Link href="/admin/events" className="text-xs font-bold text-red-300">Alle Termine</Link></div>
    <div className="mt-3 divide-y divide-white/10">{events.map((event) => <Link key={event.id} href={event.href} className="grid min-h-14 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:grid-cols-[3.5rem_4rem_minmax(0,1fr)]">
      <span className="text-sm font-black text-red-300">{date(event.startsAt)}</span><span className="hidden text-xs text-white/45 sm:block">{event.isAllDay ? "ganztägig" : time(event.startsAt)}</span><span className="min-w-0"><strong className="block truncate text-sm text-white">{event.title}</strong>{event.location ? <span className="block truncate text-xs text-white/40">{event.location}</span> : null}</span>
    </Link>)}</div>
  </section>;
}
