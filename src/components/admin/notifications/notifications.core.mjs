export const NOTIFICATION_FILTERS = Object.freeze({ ALL: "all", UNREAD: "unread", READ: "read" });

export function normalizeNotificationType(value) {
  return String(value || "future_custom").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "") || "future_custom";
}

export function normalizeNotificationTarget(value) {
  const target = String(value || "").trim();
  return target.startsWith("/") && !target.startsWith("//") ? target : "/admin/notifications";
}

export function formatNotificationAge(value, now = new Date()) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unbekannt";
  const minutes = Math.max(0, Math.floor((now.getTime() - timestamp) / 60000));
  if (minutes < 1) return "Gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;
}

export function filterNotifications(items = [], { status = "all", type = "all", search = "" } = {}) {
  const query = String(search).trim().toLocaleLowerCase("de-DE");
  return [...items]
    .filter((item) => status === "all" || (status === "read" ? item.isRead : !item.isRead))
    .filter((item) => type === "all" || item.type === type)
    .filter((item) => !query || [item.title, item.message, item.type].some((value) => String(value || "").toLocaleLowerCase("de-DE").includes(query)))
    .sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));
}

export function getNotificationTypes(items = []) {
  return [...new Set(items.map((item) => item.type).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
}
