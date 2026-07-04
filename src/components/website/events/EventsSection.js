import EventCard from "./EventCard";

export default function EventsSection({ title, eyebrow, events }) {
  return (
    <section>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
          {eyebrow}
        </p>
        <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
          {title}
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-white/10 bg-white/5 p-8 text-white/55">
          Keine Termine verfügbar.
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {events.map((event) => (
            <EventCard
              key={event.occurrence_id || `${event.id}-${event.starts_at}`}
              event={event}
            />
          ))}
        </div>
      )}
    </section>
  );
}
