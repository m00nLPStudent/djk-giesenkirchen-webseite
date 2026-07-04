export const EVENT_TYPE_LABELS = {
  training: "Training",
  spiel: "Spiel",
  turnier: "Turnier",
  vereinstermin: "Vereinstermin",
  sonstiges: "Sonstiges",
};

export const EVENT_RECURRENCE_LABELS = {
  none: "Keine Wiederholung",
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  yearly: "Jährlich",
};

const RECURRENCE_STEP_LIMIT = 1000;

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addRecurrenceStep(date, type, interval) {
  const next = new Date(date.getTime());

  switch (type) {
    case "daily":
      return addDays(next, interval);
    case "weekly":
      return addDays(next, interval * 7);
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + interval);
      return next;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + interval);
      return next;
    default:
      return next;
  }
}

function normalizeRecurrenceType(type) {
  if (!type || !EVENT_RECURRENCE_LABELS[type]) return "none";
  return type;
}

function normalizeRecurrenceInterval(value) {
  const parsed = Number(value || 1);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

function normalizeRecurrenceCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getBaseDurationMs(event) {
  if (event?.ends_at) {
    const start = toValidDate(event.starts_at);
    const end = toValidDate(event.ends_at);
    if (start && end && end > start) {
      return end.getTime() - start.getTime();
    }
  }

  if (event?.is_all_day) {
    return 24 * 60 * 60 * 1000;
  }

  return 2 * 60 * 60 * 1000;
}

export function isRecurringEvent(event = {}) {
  return normalizeRecurrenceType(event.recurrence_type) !== "none";
}

export function getRecurrenceUntilDate(event = {}) {
  return toValidDate(event.recurrence_until);
}

export function getNextOccurrence(event = {}, from = new Date()) {
  const type = normalizeRecurrenceType(event.recurrence_type);
  const start = toValidDate(event.starts_at);
  if (!start) return null;

  if (type === "none") {
    return start >= from ? start : null;
  }

  const interval = normalizeRecurrenceInterval(event.recurrence_interval);
  const until = getRecurrenceUntilDate(event);
  const maxCount = normalizeRecurrenceCount(event.recurrence_count);

  let occurrence = new Date(start.getTime());
  let occurrenceIndex = 1;

  for (let step = 0; step < RECURRENCE_STEP_LIMIT; step += 1) {
    if (maxCount && occurrenceIndex > maxCount) return null;
    if (until && occurrence > until) return null;
    if (occurrence >= from) return occurrence;

    occurrence = addRecurrenceStep(occurrence, type, interval);
    occurrenceIndex += 1;
  }

  return null;
}

export function expandRecurringEvents(
  events = [],
  { from, to, maxOccurrencesPerEvent = 120 } = {},
) {
  const now = new Date();
  const fromDate = from || addDays(now, -180);
  const toDate = to || addDays(now, 365);
  const expanded = [];

  events.forEach((item) => {
    const start = toValidDate(item?.starts_at);
    if (!start) return;

    const type = normalizeRecurrenceType(item.recurrence_type);
    const interval = normalizeRecurrenceInterval(item.recurrence_interval);
    const until = getRecurrenceUntilDate(item);
    const maxCount = normalizeRecurrenceCount(item.recurrence_count);
    const durationMs = getBaseDurationMs(item);

    let occurrence = new Date(start.getTime());
    let occurrenceIndex = 1;
    let addedCount = 0;

    for (let step = 0; step < RECURRENCE_STEP_LIMIT; step += 1) {
      if (maxCount && occurrenceIndex > maxCount) break;
      if (until && occurrence > until) break;

      if (occurrence > toDate) break;

      if (occurrence >= fromDate) {
        const occurrenceEnd = new Date(occurrence.getTime() + durationMs);

        expanded.push({
          ...item,
          starts_at: occurrence.toISOString(),
          ends_at: occurrenceEnd.toISOString(),
          occurrence_index: occurrenceIndex,
          occurrence_id: `${item.id}-${occurrenceIndex}`,
          base_event_id: item.id,
          is_recurring_instance: type !== "none",
        });

        addedCount += 1;
        if (addedCount >= maxOccurrencesPerEvent) break;
      }

      if (type === "none") break;

      occurrence = addRecurrenceStep(occurrence, type, interval);
      occurrenceIndex += 1;
    }
  });

  expanded.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
  );

  return expanded;
}

export function formatRecurrenceText(event = {}) {
  const type = normalizeRecurrenceType(event.recurrence_type);
  if (type === "none") return null;

  const interval = normalizeRecurrenceInterval(event.recurrence_interval);

  if (interval <= 1) {
    const texts = {
      daily: "Wiederholt sich täglich",
      weekly: "Wiederholt sich jede Woche",
      monthly: "Wiederholt sich jeden Monat",
      yearly: "Wiederholt sich jährlich",
    };
    return texts[type] || null;
  }

  const plural = {
    daily: "Tage",
    weekly: "Wochen",
    monthly: "Monate",
    yearly: "Jahre",
  };

  return `Wiederholt sich alle ${interval} ${plural[type] || "Intervalle"}`;
}

export function getEventTypeLabel(type) {
  return EVENT_TYPE_LABELS[type] || "Event";
}

export function getEventStatusKey(item, now = new Date()) {
  if (!item?.is_published) return "entwurf";
  if (item?.starts_at && new Date(item.starts_at) > now) return "geplant";
  return "veroeffentlicht";
}

export function formatEventDate(value, locale = "de-DE") {
  if (!value) return "Kein Datum";

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatEventTime(value, { isAllDay = false } = {}) {
  if (isAllDay) return "Ganztägig";
  if (!value) return "Uhrzeit offen";

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function splitEventsByTimeline(events = [], now = new Date()) {
  const upcoming = [];
  const past = [];

  events.forEach((item) => {
    if (!item?.starts_at) {
      upcoming.push(item);
      return;
    }

    if (new Date(item.starts_at) >= now) {
      upcoming.push(item);
      return;
    }

    past.push(item);
  });

  return {
    upcoming,
    past,
  };
}
