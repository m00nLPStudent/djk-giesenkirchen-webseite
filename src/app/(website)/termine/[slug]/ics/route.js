import { getPublishedEventBySlug } from "@/components/admin/events/services/events.service";
import {
  escapeIcsText,
  formatIcsDate,
  formatIcsDateTimeUtc,
  getEventLocation,
  resolveEventRange,
} from "@/lib/calendar";

function createIcsContent(event, slug) {
  const { start, end, isAllDay } = resolveEventRange(event);
  if (!start || !end) return null;

  const title = escapeIcsText(event.title_de || "Termin");
  const description = escapeIcsText(
    event.description_de || event.teaser_de || "",
  );
  const location = escapeIcsText(getEventLocation(event));
  const uid = escapeIcsText(`${event.id || slug}@djk-giesenkirchen.de`);
  const dtStamp = formatIcsDateTimeUtc(new Date());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DJK Giesenkirchen//Events//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${title}`,
  ];

  if (isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(end)}`);
  } else {
    lines.push(`DTSTART:${formatIcsDateTimeUtc(start)}`);
    lines.push(`DTEND:${formatIcsDateTimeUtc(end)}`);
  }

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return `${lines.join("\r\n")}\r\n`;
}

export async function GET(_request, { params }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;

  const { data: event } = await getPublishedEventBySlug(slug);
  if (!event) {
    return new Response("Not Found", { status: 404 });
  }

  const ics = createIcsContent(event, slug);
  if (!ics) {
    return new Response("Not Found", { status: 404 });
  }

  const safeSlug = String(slug || "termin").replace(/[^a-zA-Z0-9-]/g, "-");

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${safeSlug}.ics\"`,
      "Cache-Control": "no-store",
    },
  });
}
