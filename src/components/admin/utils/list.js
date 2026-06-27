export function normalizeSearch(value = "") {
  return String(value).trim().toLowerCase();
}

export function createSearchText(values = []) {
  return values.filter(Boolean).join(" ").toLowerCase();
}

export function matchesSearch(values = [], search = "") {
  const searchTerm = normalizeSearch(search);
  if (!searchTerm) return true;

  return createSearchText(values).includes(searchTerm);
}

export function matchesActiveStatus(entity = {}, filter = "all") {
  if (filter === "active" || filter === "aktiv") return Boolean(entity.is_active);
  if (filter === "inactive" || filter === "inaktiv") return !entity.is_active;
  return true;
}

export function uniqueOptions(items = [], getValue, getLabel = getValue) {
  const map = new Map();

  items.forEach((item) => {
    const value = getValue(item);
    const label = getLabel(item);

    if (!value || !label) return;
    map.set(value, label);
  });

  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
}

export function uniqueValues(items = [], getValue) {
  return [...new Set(items.map(getValue).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b)),
  );
}
