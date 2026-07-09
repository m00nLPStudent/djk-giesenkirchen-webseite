function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function normalizeRoleIds(values = []) {
  return (values || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

export function validateUserEditorValues(values, { isCreate = false } = {}) {
  const errors = {};

  if (!values.full_name?.trim()) {
    errors.full_name = "Name ist erforderlich.";
  }

  if (!values.email?.trim()) {
    errors.email = "E-Mail ist erforderlich.";
  } else if (!isEmail(values.email)) {
    errors.email = "Bitte gueltige E-Mail eingeben.";
  }

  if (!values.primary_role_id) {
    errors.primary_role_id = "Primaere Rolle ist erforderlich.";
  }

  const primaryRoleId = String(values.primary_role_id || "").trim();
  const additional = normalizeRoleIds(values.additional_role_ids || []);
  const uniqueAdditional = Array.from(new Set(additional));

  if (additional.length !== uniqueAdditional.length) {
    errors.additional_role_ids =
      "Weitere Rollen duerfen nicht mehrfach ausgewaehlt werden.";
  }

  if (primaryRoleId && uniqueAdditional.includes(primaryRoleId)) {
    errors.additional_role_ids =
      "Primaere Rolle darf nicht in weiteren Rollen enthalten sein.";
  }

  if (isCreate && !values.email?.trim()) {
    errors.email = "E-Mail ist fuer die Einladung erforderlich.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
