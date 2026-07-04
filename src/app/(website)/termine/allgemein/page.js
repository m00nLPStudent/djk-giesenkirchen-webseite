import { EventCard } from "@/components/website/events";
import { getPublishedEvents } from "@/components/admin/events/services/events.service";
import { expandRecurringEvents, splitEventsByTimeline } from "@/lib/events";

function filterRealEvents(events = []) {
  return events.filter((event) => !event?.is_virtual);
}

export default async function GeneralEventsPage() {
  const { data: events } = await getPublishedEvents();
  const now = new Date();
  const expandedEvents = expandRecurringEvents(events || [], {
    from: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxOccurrencesPerEvent: 180,
  });
  const realEvents = filterRealEvents(expandedEvents);
  const { upcoming, past } = splitEventsByTimeline(realEvents, now);

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-24 text-white">
      <section className="mx-auto max-w-7xl space-y-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Verein
          </p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            Allgemeine Termine
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            Vereinsveranstaltungen, Sitzungen, Turniere,
            Jahreshauptversammlungen und weitere öffentliche Termine.
          </p>
        </div>

        <section>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Kommende Termine
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Als Nächstes im Verein
            </h2>
          </div>

          {upcoming.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">
              Aktuell sind keine kommenden allgemeinen Termine veröffentlicht.
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {upcoming.map((event) => (
                <EventCard
                  key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                  event={event}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
              Rückblick
            </p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Vergangene Termine
            </h2>
          </div>

          {past.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">
              Aktuell sind keine vergangenen allgemeinen Termine vorhanden.
            </div>
          ) : (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {past.map((event) => (
                <EventCard
                  key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                  event={event}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
