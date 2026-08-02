import { AdminInformationRow, AdminInformationSection } from "@/components/admin/design-system";
import { formatEventDate, formatEventTime } from "@/lib/events";

export default function EventDetailSummary({ event }) {
  const location = [event.location_name, event.location_address, event.location_city].filter(Boolean).join(" · ");
  return <div className="grid gap-5 lg:grid-cols-2"><AdminInformationSection title="Termin"><AdminInformationRow label="Datum">{formatEventDate(event.starts_at)}</AdminInformationRow><AdminInformationRow label="Uhrzeit">{formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}{event.ends_at ? ` – ${formatEventTime(event.ends_at)}` : ""}</AdminInformationRow><AdminInformationRow label="Art">{event.eventTypeLabel}</AdminInformationRow></AdminInformationSection><AdminInformationSection title="Informationen"><AdminInformationRow label="Ort">{location}</AdminInformationRow><AdminInformationRow label="Wiederholung">{event.recurrence_type && event.recurrence_type !== "none" ? event.recurrence_type : "Keine"}</AdminInformationRow><AdminInformationRow label="Erstellt">{event.created_at ? new Date(event.created_at).toLocaleString("de-DE") : null}</AdminInformationRow></AdminInformationSection></div>;
}
