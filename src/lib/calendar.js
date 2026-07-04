const DEFAULT_DURATION_HOURS = 2;

function pad(value) {
  return String(value).padStart(2, "0");
}

export function getEventLocation(event = {}) {
  return [event.location_name, event.location_address, event.location_city]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(", ");
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function resolveEventRange(event = {}) {
  if (!event?.starts_at) {
    return { start: null, end: null, isAllDay: Boolean(event?.is_all_day) };
  }

  const start = new Date(event.starts_at);
  const isAllDay = Boolean(event?.is_all_day);

  if (Number.isNaN(start.getTime())) {
    return { start: null, end: null, isAllDay };
  }

  let end = null;
  if (event?.ends_at) {
    const parsedEnd = new Date(event.ends_at);
    if (!Number.isNaN(parsedEnd.getTime())) {
      end = parsedEnd;
    }
  }

  if (!end) {
    end = isAllDay
      ? addDays(start, 1)
      : addHours(start, DEFAULT_DURATION_HOURS);
  }

  if (end <= start) {
    end = isAllDay
      ? addDays(start, 1)
      : addHours(start, DEFAULT_DURATION_HOURS);
  }

  return { start, end, isAllDay };
}

export function formatIcsDate(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

export function formatIcsDateTimeUtc(date) {
  return `${formatIcsDate(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function buildGoogleCalendarUrl(event = {}) {
  const title = event.title_de || "Termin";
  const description = event.description_de || event.teaser_de || "";
  const location = getEventLocation(event);
  const { start, end, isAllDay } = resolveEventRange(event);

  if (!start || !end) return null;

  const dates = isAllDay
    ? `${formatIcsDate(start)}/${formatIcsDate(end)}`
    : `${formatIcsDateTimeUtc(start)}/${formatIcsDateTimeUtc(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
  });

  if (description) params.set("details", description);
  if (location) params.set("location", location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildOutlookCalendarUrl(event = {}) {
  const title = event.title_de || "Termin";
  const description = event.description_de || event.teaser_de || "";
  const location = getEventLocation(event);
  const { start, end, isAllDay } = resolveEventRange(event);

  if (!start || !end) return null;

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  if (description) params.set("body", description);
  if (location) params.set("location", location);
  if (isAllDay) params.set("allday", "true");

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function escapeIcsText(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}
