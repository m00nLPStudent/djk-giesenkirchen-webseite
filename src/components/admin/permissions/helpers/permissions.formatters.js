function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPermissionDateTime(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizePermissionText(value) {
  return (value || "").toLowerCase().trim();
}
