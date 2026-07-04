import { EventsSection } from "@/components/website/events";
import { getPublishedEvents } from "@/components/admin/events/services/events.service";
import { splitEventsByTimeline } from "@/lib/events";

export default async function EventsPage() {
  const { data: events } = await getPublishedEvents();
  const { upcoming, past } = splitEventsByTimeline(events || []);

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
