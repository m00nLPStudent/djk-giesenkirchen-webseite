import Link from "next/link";
import { CalendarDays, Clock, MapPin, PencilLine, Tag } from "lucide-react";
import {
  formatEventDate,
  formatEventTime,
  getEventTypeLabel,
} from "@/lib/events";

export default function DashboardToday({ events = [] }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400">
          <CalendarDays size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-black">Nächste Termine</h2>
          <p className="text-sm text-white/50">
            Die nächsten 5 Termine aus dem Event-Modul
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
          <Clock className="text-red-400" size={22} />

          <div>
            <p className="font-bold">Keine kommenden Termine vorhanden</p>
            <p className="text-sm text-white/50">
              Sobald neue Termine geplant sind, erscheinen sie hier automatisch.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const location = [event.location_name, event.location_city]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={event.occurrence_id || `${event.id}-${event.starts_at}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-white">
                      {event.title_de || "Unbenannter Termin"}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-red-400" />
                        {formatEventDate(event.starts_at)} ·{" "}
                        {formatEventTime(event.starts_at, {
                          isAllDay: event.is_all_day,
                        })}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Tag size={14} className="text-red-400" />
                        {getEventTypeLabel(event.event_type)}
                      </span>

                      {location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-red-400" />
                          {location}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/admin/events/edit/${event.id}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 transition hover:border-red-500/50 hover:text-red-300"
                    aria-label="Termin bearbeiten"
                    title="Termin bearbeiten"
                  >
                    <PencilLine size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
