export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function dateToKeyLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnlyLocal(value) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function parseTimeParts(value) {
  if (!value) return null;
  const match = String(value)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;

  return { hours, minutes, seconds };
}

export function combineDateAndTimeLocal(dateOnly, timeValue) {
  const parts = parseTimeParts(timeValue);
  if (!dateOnly || !parts) return null;

  return new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    parts.hours,
    parts.minutes,
    parts.seconds,
    0,
  );
}

export function getIsoWeekday(date) {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function getNextDateForIsoWeekday(baseDate, isoWeekday) {
  const current = getIsoWeekday(baseDate);
  const delta =
    isoWeekday >= current ? isoWeekday - current : 7 - (current - isoWeekday);
  return addDays(baseDate, delta);
}

export function minDate(a, b) {
  return a.getTime() <= b.getTime() ? a : b;
}

export function maxDate(a, b) {
  return a.getTime() >= b.getTime() ? a : b;
}

export function isDateWithinRange(date, start, end) {
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}
