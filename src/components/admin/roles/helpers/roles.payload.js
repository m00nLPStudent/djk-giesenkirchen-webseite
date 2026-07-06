export function normalizeRoleKey(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildRolePayload(values = {}) {
  return {
    name: (values.name || "").trim(),
    key: normalizeRoleKey(values.key || values.name),
    description: (values.description || "").trim() || null,
    sort_order: Number.isFinite(Number(values.sort_order))
      ? Number(values.sort_order)
      : 0,
    is_active: values.is_active !== false,
  };
}

export function validateRolePayload(payload = {}) {
  const errors = {};

  if (!payload.name) {
    errors.name = "Name ist ein Pflichtfeld.";
  }

  if (!payload.key) {
    errors.key = "Key ist ein Pflichtfeld.";
  }

  if (payload.key && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.key)) {
    errors.key = "Key muss lowercase/kebab-case sein.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
