function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRoleDateTime(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRoleStatusLabel(isActive) {
  return isActive ? "Aktiv" : "Inaktiv";
}

export function normalizeRoleText(value) {
  return (value || "").toLowerCase().trim();
}
