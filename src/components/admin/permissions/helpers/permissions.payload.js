export function normalizePermissionKey(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9.\s_-]/g, "")
    .replace(/\s+/g, ".")
    .replace(/_+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
    .replace(/-/g, ".");
}

export function buildPermissionPayload(values = {}) {
  return {
    name: (values.name || "").trim(),
    key: normalizePermissionKey(values.key || values.name),
    description: (values.description || "").trim() || null,
    category: (values.category || "").trim().toLowerCase(),
  };
}

export function validatePermissionPayload(payload = {}) {
  const errors = {};

  if (!payload.name) errors.name = "Name ist ein Pflichtfeld.";
  if (!payload.key) errors.key = "Key ist ein Pflichtfeld.";
  if (!payload.category) errors.category = "Kategorie ist ein Pflichtfeld.";

  if (payload.key && !/^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(payload.key)) {
    errors.key = "Key muss lowercase dot-notation sein, z. B. news.view.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
