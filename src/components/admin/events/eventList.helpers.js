import { getEventStatusKey } from "@/lib/events";

export function getNextCalendarDayWindow(now = new Date()) {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { from: tomorrow, to: tomorrow };
}

export function prepareAdminEventList(clubEvents = [], teamEvents = [], now = new Date()) {
  const clubItems = clubEvents.map((event) => ({ ...event, admin_source: "verein", admin_status: getEventStatusKey(event, now) }));
  const teamItems = teamEvents.map((event) => ({ ...event, admin_source: "mannschaft", admin_status: new Date(event.starts_at) < now ? "vergangen" : "geplant" }));
  return [...clubItems, ...teamItems].sort((left, right) => new Date(left?.starts_at || 0).getTime() - new Date(right?.starts_at || 0).getTime());
}

export function getAdminEventSummary(events = []) {
  const clubEvents = events.filter((item) => item.admin_source === "verein");
  return {
    published: clubEvents.filter((item) => item.admin_status === "veroeffentlicht").length,
    planned: clubEvents.filter((item) => item.admin_status === "geplant").length,
    drafts: clubEvents.filter((item) => item.admin_status === "entwurf").length,
    trainingTomorrow: events.filter((item) => item.admin_source === "mannschaft").length,
  };
}

export function filterAdminEventList(events, { search = "", status = "alle", source = "alle" } = {}) {
  const query = String(search).trim().toLocaleLowerCase("de-DE");
  return events.filter((event) => {
    if (status !== "alle" && event.admin_status !== status) return false;
    if (source !== "alle" && event.admin_source !== source) return false;
    if (!query) return true;
    return [event.title_de, event.teaser_de, event.description_de, event.event_type, event.location_name, event.location_city, event.team_name_de, event.team_season_name]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("de-DE").includes(query));
  });
}
