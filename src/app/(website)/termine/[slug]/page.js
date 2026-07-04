import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CalendarDays, Download } from "lucide-react";
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
} from "@/lib/calendar";
import { formatFileSize } from "@/lib/files";
import { buildGoogleMapsSearchUrl } from "@/lib/maps";
import {
  formatEventDate,
  formatRecurrenceText,
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
  const mapsUrl = buildGoogleMapsSearchUrl({
    locationName: event.location_name,
    locationAddress: event.location_address,
    locationCity: event.location_city,
  });
  const googleCalendarUrl = buildGoogleCalendarUrl(event);
  const outlookCalendarUrl = buildOutlookCalendarUrl(event);
  const icsUrl = event.slug ? `/termine/${event.slug}/ics` : null;
  const recurrenceText = formatRecurrenceText(event);
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

          <div className="mt-6 flex flex-wrap items-center gap-4 text-white/60">
            <div className="flex flex-wrap items-center gap-6">
              <span>{formatEventDate(event.starts_at)}</span>
              <span>
                {formatEventTime(event.starts_at, {
                  isAllDay: event.is_all_day,
                })}
              </span>
              {event.ends_at && (
                <span>
                  bis {formatEventDate(event.ends_at)} ·{" "}
                  {formatEventTime(event.ends_at)}
                </span>
              )}
            </div>

            {(icsUrl || googleCalendarUrl || outlookCalendarUrl) && (
              <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto">
                {icsUrl && (
                  <a
                    href={icsUrl}
                    title="ICS herunterladen"
                    aria-label="ICS herunterladen"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/60 transition hover:border-red-500/50 hover:bg-red-600/15 hover:text-red-300"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}

                {googleCalendarUrl && (
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="In Google Kalender öffnen"
                    aria-label="In Google Kalender öffnen"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/60 transition hover:border-red-500/50 hover:bg-red-600/15 hover:text-red-300"
                  >
                    <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}

                {outlookCalendarUrl && (
                  <a
                    href={outlookCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="In Outlook Kalender öffnen"
                    aria-label="In Outlook Kalender öffnen"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/60 transition hover:border-red-500/50 hover:bg-red-600/15 hover:text-red-300"
                  >
                    <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>

          {recurrenceText && (
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.14em] text-white/55">
              {recurrenceText}
            </p>
          )}

          {location && (
            <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold uppercase tracking-[0.15em] text-white/70">
              <p className="min-w-0 flex-1 break-words">{location}</p>

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Route in Google Maps öffnen"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/20 text-white/55 transition hover:border-red-500/50 hover:bg-red-600/15 hover:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </a>
              )}
            </div>
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
