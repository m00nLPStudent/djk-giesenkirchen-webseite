const normalized = (value) => typeof value === "string" && value.trim() ? value.trim() : null;

export function resolvePersonDisplayName(person = {}, fallback = "Unbekannte Person") {
  return normalized(person.displayName) ||
    normalized(person.display_name) ||
    normalized(person.fullName) ||
    normalized(person.full_name) ||
    normalized(`${person.firstName || person.first_name || ""} ${person.lastName || person.last_name || ""}`) ||
    normalized(person.name) ||
    fallback;
}
