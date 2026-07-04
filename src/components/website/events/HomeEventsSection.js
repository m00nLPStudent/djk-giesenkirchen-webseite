import Link from "next/link";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events";

export default function HomeEventsSection({ events = [] }) {
  return (
    <section className="relative overflow-hidden border-t border-white/10 px-6 py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#c4001a33,transparent_38%),linear-gradient(120deg,#0f0f14_20%,#171720_60%,#101014_100%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Verein
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Nächste Termine
            </h2>
          </div>

          <Link
            href="/termine"
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Alle Termine
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">
            Aktuell sind keine veröffentlichten Termine hinterlegt.
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                href={
                  event.is_virtual === true &&
                  event.source_type === "team_training"
                    ? `/termine/training/${event.occurrence_id}`
                    : event.slug
                      ? `/termine/${event.slug}`
                      : "/termine"
                }
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 transition hover:border-red-500/50 hover:bg-white/10"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
                  {getEventTypeLabel(event.event_type)}
                </p>
                <h3 className="mt-3 text-xl font-black leading-tight">
                  {event.title_de}
                </h3>
                <p className="mt-4 text-sm text-white/60">
                  {formatEventDate(event.starts_at)} ·{" "}
                  {formatEventTime(event.starts_at, {
                    isAllDay: event.is_all_day,
                  })}
                </p>
                {(event.location_name || event.location_city) && (
                  <p className="mt-2 text-sm text-white/45">
                    {[event.location_name, event.location_city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
