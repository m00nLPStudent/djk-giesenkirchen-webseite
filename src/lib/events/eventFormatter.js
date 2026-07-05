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

export function getTrainingTypeLabel(type = "training") {
  const map = {
    training: "Training",
    spiel: "Spiel",
    torwart: "Torwarttraining",
    foerdertraining: "Foerdertraining",
    athletik: "Athletik",
    hallentraining: "Hallentraining",
    sonstiges: "Termin",
  };

  return map[type] || "Training";
}

export function getEventTypeLabel(type) {
  return EVENT_TYPE_LABELS[type] || "Event";
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

export function getEventStatusKey(item, now = new Date()) {
  if (!item?.is_published) return "entwurf";
  if (item?.starts_at && new Date(item.starts_at) > now) return "geplant";
  return "veroeffentlicht";
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
