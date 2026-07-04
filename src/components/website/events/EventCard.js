import Link from "next/link";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events";

export default function EventCard({ event }) {
  const locationLabel = [event.location_name, event.location_city]
    .filter(Boolean)
    .join(" · ");
  const href = event.slug ? `/termine/${event.slug}` : "/termine";

  const shortDescription =
    event.teaser_de ||
    event.description_de ||
    "Für diesen Termin liegt noch keine Kurzbeschreibung vor.";

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 transition hover:border-red-500/40 hover:bg-white/10"
    >
      {event.image_url && (
        <div className="flex h-56 items-center justify-center bg-white/5 p-6">
          <img
            src={event.image_url}
            alt={event.title_de}
            className="h-full w-full rounded-[1.25rem] object-cover"
          />
        </div>
      )}

      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-red-400">
            {getEventTypeLabel(event.event_type)}
          </span>

          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">
            {formatEventDate(event.starts_at)}
          </span>

          <span className="text-xs font-bold uppercase tracking-[0.15em] text-white/45">
            {formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-black leading-tight text-white md:text-3xl">
          {event.title_de}
        </h2>

        {locationLabel && (
          <p className="mt-3 text-sm font-bold uppercase tracking-[0.15em] text-white/50">
            {locationLabel}
          </p>
        )}

        <p className="mt-4 text-sm leading-7 text-white/65">
          {shortDescription}
        </p>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-red-400">
          Zum Termin
        </p>
      </div>
    </Link>
  );
}
