import { normalizeRoleText } from "./roles.formatters";

function compareByName(a, b) {
  return (a.name || "").localeCompare(b.name || "", "de-DE");
}

function compareByDate(a, b) {
  const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bDate - aDate;
}

function sortRoles(roles, sortBy) {
  const copy = [...roles];

  switch (sortBy) {
    case "sort_desc":
      return copy.sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
    case "sort_asc":
      return copy.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    case "name_desc":
      return copy.sort((a, b) => -compareByName(a, b));
    case "name_asc":
      return copy.sort(compareByName);
    case "created_asc":
      return copy.sort((a, b) => -compareByDate(a, b));
    case "created_desc":
    default:
      return copy.sort(compareByDate);
  }
}

function includesSearch(role, query) {
  if (!query) return true;
  const search = normalizeRoleText(query);

  return [role.name, role.key, role.description]
    .map((value) => normalizeRoleText(value))
    .some((value) => value.includes(search));
}

function includesStatus(role, status) {
  if (status === "all") return true;
  if (status === "active") return role.is_active;
  if (status === "inactive") return !role.is_active;
  return true;
}

export function applyRolesFilters(roles, filters) {
  const { search = "", status = "all", sort = "created_desc" } = filters || {};

  const filtered = (roles || []).filter(
    (role) => includesSearch(role, search) && includesStatus(role, status),
  );

  return sortRoles(filtered, sort);
}
