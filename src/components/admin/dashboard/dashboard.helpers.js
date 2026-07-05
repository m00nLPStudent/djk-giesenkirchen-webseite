export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatHeaderTimestamp(now) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

function isSameCalendarDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function splitEventsByToday(events = [], now = new Date()) {
  const today = [];
  const upcoming = [];

  events.forEach((event) => {
    const startsAt = new Date(event.starts_at);
    if (isSameCalendarDay(startsAt, now)) {
      today.push(event);
      return;
    }
    upcoming.push(event);
  });

  return { today, upcoming };
}

export function getNewsStateLabel(newsItem, now = new Date()) {
  if (!newsItem?.is_published) return "Entwurf";
  if (!newsItem?.published_at) return "Veröffentlicht";

  const publicationDate = new Date(newsItem.published_at);
  if (publicationDate.getTime() > now.getTime()) {
    return "Geplant";
  }

  return "Veröffentlicht";
}

export function buildSystemStatusItems(signals = {}) {
  const items = [];

  if (!signals.impressumPublished) {
    items.push({
      id: "impressum",
      level: "warning",
      text: "Impressum ist nicht veröffentlicht.",
    });
  }

  if (!signals.datenschutzPublished) {
    items.push({
      id: "datenschutz",
      level: "warning",
      text: "Datenschutz ist nicht veröffentlicht.",
    });
  }

  if ((signals.membershipOpenTotal || 0) > 0) {
    items.push({
      id: "membership-open",
      level: "info",
      text: `${signals.membershipOpenTotal} offene Mitgliedsanfragen vorhanden.`,
    });
  }

  if ((signals.newsPlannedOrDraft || 0) > 0) {
    items.push({
      id: "news-unpublished",
      level: "info",
      text: `${signals.newsPlannedOrDraft} News sind Entwurf oder geplant.`,
    });
  }

  if (!signals.hasActiveMembershipRecipients) {
    items.push({
      id: "recipients",
      level: "warning",
      text: "Keine aktiven Empfänger für Mitgliedsanfragen hinterlegt.",
    });
  }

  return items;
}
