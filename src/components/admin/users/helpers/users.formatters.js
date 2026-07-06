function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(date);
}

export function buildInitials(name, email) {
  const source = (name || email || "?").trim();
  if (!source) return "?";

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

export function formatStatusLabel(isActive) {
  return isActive ? "Aktiv" : "Inaktiv";
}

export function normalizeText(value) {
  return (value || "").toLowerCase().trim();
}
