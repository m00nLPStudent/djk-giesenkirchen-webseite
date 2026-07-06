import { normalizeText } from "./users.formatters";

function compareDate(a, b, direction = "desc") {
  const aDate = a ? new Date(a).getTime() : 0;
  const bDate = b ? new Date(b).getTime() : 0;

  if (direction === "asc") return aDate - bDate;
  return bDate - aDate;
}

function compareName(a, b, direction = "asc") {
  const value = (a.name || "").localeCompare(b.name || "", "de-DE");
  return direction === "asc" ? value : -value;
}

function sortUsers(users, sortBy) {
  const copy = [...users];

  switch (sortBy) {
    case "name_desc":
      return copy.sort((a, b) => compareName(a, b, "desc"));
    case "created_desc":
      return copy.sort((a, b) => compareDate(a.created_at, b.created_at, "desc"));
    case "created_asc":
      return copy.sort((a, b) => compareDate(a.created_at, b.created_at, "asc"));
    case "last_login_desc":
      return copy.sort((a, b) => compareDate(a.last_login_at, b.last_login_at, "desc"));
    case "last_login_asc":
      return copy.sort((a, b) => compareDate(a.last_login_at, b.last_login_at, "asc"));
    case "name_asc":
    default:
      return copy.sort((a, b) => compareName(a, b, "asc"));
  }
}

function includesRole(user, roleFilter) {
  if (roleFilter === "all") return true;
  return (user.roles || []).some((role) => role.id === roleFilter);
}

function includesStatus(user, statusFilter) {
  if (statusFilter === "all") return true;
  if (statusFilter === "active") return user.is_active;
  if (statusFilter === "inactive") return !user.is_active;
  return true;
}

function includesSearch(user, search) {
  if (!search) return true;

  const query = normalizeText(search);
  const name = normalizeText(user.name);
  const email = normalizeText(user.email);
  const primaryRole = normalizeText(user.primaryRole?.name);

  return (
    name.includes(query) ||
    email.includes(query) ||
    primaryRole.includes(query) ||
    (user.roles || []).some((role) => normalizeText(role.name).includes(query))
  );
}

export function applyUsersFilters(users, filters) {
  const { search = "", status = "all", role = "all", sort = "name_asc" } = filters || {};

  const filtered = (users || []).filter(
    (user) => includesSearch(user, search) && includesStatus(user, status) && includesRole(user, role),
  );

  return sortUsers(filtered, sort);
}
