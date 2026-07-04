import Link from "next/link";
import { notFound } from "next/navigation";
import { formatFileSize } from "@/lib/files";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events";
import {
  diagnoseEventLookupBySlug,
  getPublishedEventBySlug,
} from "@/components/admin/events/services/events.service";

export default async function EventDetailPage({ params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const { data: event } = await getPublishedEventBySlug(slug);

  if (!event) {
    const diagnostic = await diagnoseEventLookupBySlug(slug);
    console.warn("[events/detail] Event lookup failed", {
      slug,
      normalizedSlug: diagnostic.slug,
      reason: diagnostic.reason,
      eventId: diagnostic.event?.id ?? null,
      isPublished: diagnostic.event?.is_published ?? null,
      error: diagnostic.error?.message ?? null,
    });
    notFound();
  }

  const location = [
    event.location_name,
    event.location_address,
    event.location_city,
  ]
    .filter(Boolean)
    .join(" · ");
  const documents = (event.event_documents || [])
    .filter((document) => document.is_public)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <section className="px-6 pt-32 pb-20">
        <div className="mx-auto max-w-5xl">
          {event.image_url && (
            <img
              src={event.image_url}
              alt={event.title_de}
              className="mb-10 max-h-[460px] w-full rounded-3xl bg-white/5 object-contain p-8"
            />
          )}

          <p className="text-sm uppercase tracking-[0.35em] text-red-400">
            {getEventTypeLabel(event.event_type)}
          </p>

          <h1 className="mt-4 text-5xl font-black leading-tight md:text-6xl">
            {event.title_de}
          </h1>

          <div className="mt-6 flex flex-wrap gap-6 text-white/60">
            <span>{formatEventDate(event.starts_at)}</span>
            <span>
              {formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}
            </span>
            {event.ends_at && (
              <span>
                bis {formatEventDate(event.ends_at)} ·{" "}
                {formatEventTime(event.ends_at)}
              </span>
            )}
          </div>

          {location && (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white/70">
              {location}
            </p>
          )}

          {event.team?.name_de && (
            <p className="mt-4 text-sm text-white/55">
              Zugehörige Mannschaft:{" "}
              <span className="font-bold text-white">{event.team.name_de}</span>
            </p>
          )}

          {event.external_url && (
            <div className="mt-8">
              <a
                href={event.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-red-500/40 bg-red-600/20 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-600/30"
              >
                Externer Link
              </a>
            </div>
          )}

          <div className="mt-12 text-lg leading-9 text-white/80">
            {event.description_de ||
              event.teaser_de ||
              "Für diesen Termin liegt aktuell keine ausführliche Beschreibung vor."}
          </div>

          {documents.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
                {documents.length > 1 ? "Downloads" : "Download"}
              </h2>

              <ul className="mt-3 space-y-2">
                {documents.map((document) => {
                  const fileSize = formatFileSize(document.file_size);

                  return (
                    <li key={document.id}>
                      <Link
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 py-1 text-sm text-white/80 transition hover:text-red-400"
                      >
                        <span className="truncate">
                          {document.display_name_de ||
                            document.file_name ||
                            "Download"}
                        </span>
                        {fileSize && (
                          <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-white/40">
                            {fileSize}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <Link
              href="/termine"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              Zurück zur Terminübersicht
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
