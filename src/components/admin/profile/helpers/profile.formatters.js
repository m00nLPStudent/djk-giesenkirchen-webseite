function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatProfileDateTime(value) {
  const date = toDate(value);
  if (!date) return "-";

  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatStatusLabel(isActive) {
  if (isActive === true) return "Aktiv";
  if (isActive === false) return "Inaktiv";
  return "Unbekannt";
}

export function formatRoleList(roles = []) {
  return (roles || []).map((role) => role?.name || role?.key).filter(Boolean);
}

export function formatPermissionCount(permissions = []) {
  return Array.isArray(permissions) ? permissions.length : 0;
}
