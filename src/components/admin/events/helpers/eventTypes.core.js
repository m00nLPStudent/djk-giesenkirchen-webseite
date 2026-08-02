export const UNKNOWN_EVENT_TYPE_LABEL = "Unbekannte Terminart";

export function createEventTypeMap(eventTypes = []) {
  return new Map(
    eventTypes
      .filter((item) => item?.slug)
      .map((item) => [item.slug, item.name_de || UNKNOWN_EVENT_TYPE_LABEL]),
  );
}

export function resolveEventTypeLabel(eventTypes, eventTypeKey) {
  if (!eventTypeKey) return UNKNOWN_EVENT_TYPE_LABEL;
  return createEventTypeMap(eventTypes).get(eventTypeKey) || UNKNOWN_EVENT_TYPE_LABEL;
}

export function createEventDto(event = {}, eventTypes = []) {
  const eventTypeKey = event.eventTypeKey || event.event_type || "";
  return {
    ...event,
    id: event.id,
    slug: event.slug || null,
    title: event.title || event.title_de || "Unbenannter Termin",
    startsAt: event.startsAt || event.starts_at || null,
    endsAt: event.endsAt || event.ends_at || null,
    location:
      event.location ||
      [event.location_name, event.location_city].filter(Boolean).join(" · ") ||
      null,
    eventTypeKey,
    eventTypeLabel:
      event.eventTypeLabel || resolveEventTypeLabel(eventTypes, eventTypeKey),
  };
}

export function createEventDtos(events = [], eventTypes = []) {
  const labels = createEventTypeMap(eventTypes);
  return events.map((event) => {
    const eventTypeKey = event.eventTypeKey || event.event_type || "";
    return {
      ...createEventDto(event),
      eventTypeKey,
      eventTypeLabel: labels.get(eventTypeKey) || UNKNOWN_EVENT_TYPE_LABEL,
    };
  });
}
