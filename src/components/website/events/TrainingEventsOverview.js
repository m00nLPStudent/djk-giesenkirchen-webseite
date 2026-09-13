import Link from "next/link";
import EventCard from "./EventCard";

export default function TrainingEventsOverview({ events = [], range = "short", basePath = "/termine/training", eyebrow = "Training", title = "Trainingstermine", description = "Automatisch erzeugte Trainingszeiten des Vereins für die nächsten Tage." }) {
  return (
    <section className="space-y-14">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">{eyebrow}</p>
        <h1 className="mt-4 text-4xl font-black md:text-7xl">{title}</h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-white/70 md:text-lg md:leading-8">{description}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {[{ value: "short", label: "Heute & Morgen" }, { value: "week", label: "Diese Woche" }].map((item) => (
          <Link key={item.value} href={item.value === "week" ? `${basePath}?range=week` : basePath} className={`rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.18em] transition ${range === item.value ? "border-red-500 bg-red-600/20 text-red-200" : "border-white/10 bg-white/5 text-white/65 hover:border-red-500/40 hover:text-white"}`}>
            {item.label}
          </Link>
        ))}
      </div>
      {events.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">Aktuell sind keine Trainingstermine in diesem Zeitraum vorhanden.</div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {events.map((event) => <EventCard key={event.occurrence_id || `${event.id}-${event.starts_at}`} event={event} />)}
        </div>
      )}
    </section>
  );
}
