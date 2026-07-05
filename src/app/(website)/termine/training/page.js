import Link from "next/link";
import { EventCard } from "@/components/website/events";
import { getVirtualTrainingEvents } from "@/lib/events";

function getStartOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );
}

function getEndOfDay(date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export default async function TrainingEventsPage({ searchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const trainingRange =
    resolvedSearchParams?.range === "week" ? "week" : "short";
  const now = new Date();
  const trainingFrom = getStartOfDay(now);
  const trainingTo =
    trainingRange === "week"
      ? getEndOfDay(new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000))
      : getEndOfDay(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000));

  const virtualTrainings = await getVirtualTrainingEvents({
    from: trainingFrom,
    to: trainingTo,
    maxOccurrencesPerTraining: trainingRange === "week" ? 8 : 3,
  });

  return (
    <main className="min-h-screen bg-[#101014] px-4 pt-28 pb-20 text-white sm:px-6 md:pt-32 md:pb-24">
      <section className="mx-auto max-w-7xl space-y-14">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
            Training
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-7xl">
            Trainingstermine
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg md:leading-8">
            Automatisch erzeugte Trainingszeiten der Mannschaften für die
            nächsten Tage.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/termine/training"
            className={`rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
              trainingRange === "short"
                ? "border-red-500 bg-red-600/20 text-red-200"
                : "border-white/10 bg-white/5 text-white/65 hover:border-red-500/40 hover:text-white"
            }`}
          >
            Heute & Morgen
          </Link>
          <Link
            href="/termine/training?range=week"
            className={`rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${
              trainingRange === "week"
                ? "border-red-500 bg-red-600/20 text-red-200"
                : "border-white/10 bg-white/5 text-white/65 hover:border-red-500/40 hover:text-white"
            }`}
          >
            Diese Woche
          </Link>
        </div>

        {virtualTrainings.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">
            Aktuell sind keine Trainingstermine in diesem Zeitraum vorhanden.
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {virtualTrainings.map((event) => (
              <EventCard
                key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                event={event}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
