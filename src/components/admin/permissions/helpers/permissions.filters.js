import { normalizePermissionText } from "./permissions.formatters";

function compareByCreatedAt(a, b, direction = "desc") {
  const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
  return direction === "asc" ? aDate - bDate : bDate - aDate;
}

function compareByString(a, b, key, direction = "asc") {
  const result = (a[key] || "").localeCompare(b[key] || "", "de-DE");
  return direction === "asc" ? result : -result;
}

function sortPermissions(items = [], sort = "created_desc") {
  const copy = [...items];

  switch (sort) {
    case "category_asc":
      return copy.sort((a, b) => compareByString(a, b, "category", "asc"));
    case "category_desc":
      return copy.sort((a, b) => compareByString(a, b, "category", "desc"));
    case "name_asc":
      return copy.sort((a, b) => compareByString(a, b, "name", "asc"));
    case "name_desc":
      return copy.sort((a, b) => compareByString(a, b, "name", "desc"));
    case "key_asc":
      return copy.sort((a, b) => compareByString(a, b, "key", "asc"));
    case "key_desc":
      return copy.sort((a, b) => compareByString(a, b, "key", "desc"));
    case "created_asc":
      return copy.sort((a, b) => compareByCreatedAt(a, b, "asc"));
    case "created_desc":
    default:
      return copy.sort((a, b) => compareByCreatedAt(a, b, "desc"));
  }
}

export function applyPermissionsFilters(items = [], filters = {}) {
  const { search = "", category = "all", sort = "created_desc" } = filters;
  const query = normalizePermissionText(search);

  const filtered = (items || []).filter((permission) => {
    const categoryMatch =
      category === "all" || permission.category === category;
    const searchMatch =
      !query ||
      [permission.name, permission.key, permission.description]
        .map((value) => normalizePermissionText(value))
        .some((value) => value.includes(query));

    return categoryMatch && searchMatch;
  });

  return sortPermissions(filtered, sort);
}
