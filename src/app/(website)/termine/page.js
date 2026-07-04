import { EventsSection } from "@/components/website/events";
import { getPublishedEvents } from "@/components/admin/events/services/events.service";
import {
  expandRecurringEvents,
  getVirtualTrainingEvents,
  mergeEventsWithVirtualTrainings,
  splitEventsByTimeline,
} from "@/lib/events";

export default async function EventsPage() {
  const { data: events } = await getPublishedEvents();
  const now = new Date();
  const expandedEvents = expandRecurringEvents(events || [], {
    from: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxOccurrencesPerEvent: 180,
  });
  const virtualTrainings = await getVirtualTrainingEvents({
    from: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
    to: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    maxOccurrencesPerTraining: 180,
  });
  const mergedEvents = mergeEventsWithVirtualTrainings(
    expandedEvents,
    virtualTrainings,
  );
  const { upcoming, past } = splitEventsByTimeline(mergedEvents, now);

  return (
    <main className="min-h-screen bg-[#101014] px-6 pt-32 pb-24 text-white">
      <section className="mx-auto max-w-7xl space-y-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Verein
          </p>
          <h1 className="mt-4 text-5xl font-black md:text-7xl">Termine</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            Alle veröffentlichten Veranstaltungen, Trainings, Spiele und
            Vereinstermine auf einen Blick.
          </p>
        </div>

        <EventsSection
          eyebrow="Kommende Termine"
          title="Als Nächstes im Verein"
          events={upcoming}
        />

        <EventsSection
          eyebrow="Vergangene Termine"
          title="Rückblick"
          events={past}
        />
      </section>
    </main>
  );
}
