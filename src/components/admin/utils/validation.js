export function validateRequiredFields(form = {}, requiredFields = {}) {
  const errors = {};

  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!String(form[field] || "").trim()) {
      errors[field] = `${label} ist ein Pflichtfeld.`;
    }
  });

  return errors;
}

export function hasValidationErrors(errors = {}) {
  return Object.values(errors).some(Boolean);
}

export const REQUIRED_FIELDS_MESSAGE = "Bitte fülle alle Pflichtfelder aus.";
