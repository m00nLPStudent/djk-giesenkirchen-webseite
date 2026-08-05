const CENTER = "/admin/notifications";

const relevantEventFields = [
  "title_de", "starts_at", "ends_at", "location_name", "location_address",
  "location_city", "event_type", "team_id", "is_published", "description_de",
];

const value = (item, key) => item?.[key] ?? null;
const text = (input, fallback) => String(input || "").trim() || fallback;

export function getRelevantEventChanges(previous, next) {
  if (!previous || !next) return [];
  return relevantEventFields.filter((field) => value(previous, field) !== value(next, field));
}

export function getEventNotificationPlan(previous, next) {
  if (!next?.team_id && !previous?.team_id) return null;
  if (!previous) return { type: "event_created", teamIds: [next.team_id], changes: ["created"] };
  const changes = getRelevantEventChanges(previous, next);
  if (!changes.length) return null;
  return {
    type: "event_updated",
    teamIds: [...new Set([previous.team_id, next.team_id].filter(Boolean))],
    changes,
  };
}

function formatDate(value) {
  if (!value) return "einem noch unbekannten Zeitpunkt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Berlin" }).format(new Date(value));
}

export function buildEventNotification(type, event = {}, context = {}) {
  const title = text(event.title_de, "Termin");
  const teamName = text(context.teamName, "der Mannschaft");
  const labels = type === "event_created"
    ? ["Neuer Mannschaftstermin", `Für ${teamName} wurde der Termin „${title}“ am ${formatDate(event.starts_at)} angelegt.`]
    : ["Mannschaftstermin geändert", `Der Termin „${title}“ von ${teamName} wurde geändert.`];
  return {
    type,
    title: labels[0],
    message: labels[1],
    entityType: "event",
    entityId: event.id || null,
    targetUrl: CENTER,
    metadata: {
      eventId: event.id || null,
      eventSlug: event.slug || null,
      teamId: context.teamId || event.team_id || null,
      teamName: context.teamName || null,
      seasonLabel: context.seasonLabel || null,
      startsAt: event.starts_at || null,
      locationName: event.location_name || null,
      eventType: event.event_type || null,
      isPublished: Boolean(event.is_published),
      changes: context.changes || [],
      idempotencyKey: `${type}:${event.id || "unknown"}:${context.changeKey || event.updated_at || event.created_at || "current"}:${context.teamId || event.team_id || "none"}`,
    },
  };
}

export function resolveEditorialTarget(recipient = {}, event = {}) {
  if (event.entityType !== "event") return CENTER;
  if (recipient.permissionKeys?.includes("events.edit") && event.entityId) return `/admin/events/edit/${event.entityId}`;
  if (event.metadata?.isPublished && event.metadata?.eventSlug) return `/termine/${event.metadata.eventSlug}`;
  return CENTER;
}
