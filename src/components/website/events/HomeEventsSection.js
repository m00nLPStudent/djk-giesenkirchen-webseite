import Link from "next/link";
import { formatEventDate, formatEventDateWithWeekday, formatEventTime, getTrainingLocationTypeLabel } from "@/lib/events";
import TrainingSportIcon from "./TrainingSportIcon";

export default function HomeEventsSection({ events = [], compact = false }) {
  if (compact) {
    return (
      <aside className="min-w-0 w-full rounded-[1.75rem] border border-white/10 bg-[#15151b]/95 p-5 text-white shadow-[0_24px_65px_rgba(0,0,0,0.32)] lg:p-6" aria-labelledby="home-events-title">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">Verein</p>
            <h2 id="home-events-title" className="mt-3 break-words text-2xl font-black">Nächste Trainingstermine</h2>
          </div>
          <Link href="/termine/training" className="max-w-full text-left text-xs font-black uppercase tracking-[0.12em] text-red-300 hover:text-white hover:underline sm:text-right">Alle Trainingszeiten</Link>
        </div>
        {events.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-5 text-sm leading-6 text-white/55">Aktuell sind keine kommenden Trainingstermine hinterlegt.</p>
        ) : (
          <div className="mt-5 space-y-2">
            {events.map((event) => (
              <Link
                key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                href={event.source_type === "department_training" && event.department_href ? event.department_href : `/termine/training/${event.occurrence_id}`}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-[#1d1d24] px-3 py-2.5 transition hover:border-red-400/35 hover:bg-red-600/10 focus-visible:outline-2 focus-visible:outline-red-500 sm:gap-3"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[#111117]/85 text-white/90 shadow-[0_5px_14px_rgba(0,0,0,0.24)] sm:h-12 sm:w-12" aria-hidden="true">
                  <TrainingSportIcon event={event} />
                </span>
                <span className="min-w-0">
                  <span className="block break-words text-sm font-black leading-snug sm:text-base">{event.team_name_de || event.title_de}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-white/50">{formatEventDateWithWeekday(event.starts_at)}</span>
                </span>
                <span className="min-w-[4.5rem] text-right">
                  <span className="block text-sm font-black text-white">{formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}</span>
                  {getTrainingLocationTypeLabel(event.training_location_type) && (
                    <span className="mt-0.5 block text-xs leading-4 text-white/45">{getTrainingLocationTypeLabel(event.training_location_type)}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        )}
      </aside>
    );
  }

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
                  {event.eventTypeLabel}
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
                {(event.training_location_type || event.location_name || event.location_city) && (
                  <p className="mt-2 text-sm text-white/45">
                    {[getTrainingLocationTypeLabel(event.training_location_type), event.location_name, event.location_city]
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
