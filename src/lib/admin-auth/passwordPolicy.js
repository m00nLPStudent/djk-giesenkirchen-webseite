const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

function hasUppercase(value = "") {
  return /[A-Z]/.test(value);
}

function hasLowercase(value = "") {
  return /[a-z]/.test(value);
}

function hasNumber(value = "") {
  return /[0-9]/.test(value);
}

function hasSpecial(value = "") {
  return SPECIAL_CHAR_REGEX.test(value);
}

function hasNoWhitespace(value = "") {
  return !/\s/.test(value);
}

function hasMinLength(value = "") {
  return value.length >= 8;
}

export function getPasswordChecklist(password = "", confirmPassword = "") {
  return [
    {
      key: "minLength",
      label: "Mindestens 8 Zeichen",
      valid: hasMinLength(password),
    },
    {
      key: "uppercase",
      label: "Mindestens 1 Grossbuchstabe",
      valid: hasUppercase(password),
    },
    {
      key: "lowercase",
      label: "Mindestens 1 Kleinbuchstabe",
      valid: hasLowercase(password),
    },
    { key: "number", label: "Mindestens 1 Zahl", valid: hasNumber(password) },
    {
      key: "special",
      label: "Mindestens 1 Sonderzeichen",
      valid: hasSpecial(password),
    },
    {
      key: "noWhitespace",
      label: "Keine Leerzeichen",
      valid: hasNoWhitespace(password),
    },
    {
      key: "matches",
      label: "Passwoerter stimmen ueberein",
      valid: Boolean(password) && password === confirmPassword,
    },
  ];
}

export function validateAdminPassword(password = "", confirmPassword = "") {
  const checklist = getPasswordChecklist(password, confirmPassword);
  const isValid = checklist.every((entry) => entry.valid);

  if (isValid) {
    return { isValid: true, errors: [] };
  }

  return {
    isValid: false,
    errors: checklist
      .filter((entry) => !entry.valid)
      .map((entry) => entry.label),
  };
}

export function getPasswordStrength(password = "") {
  const score = [
    hasMinLength(password),
    hasUppercase(password),
    hasLowercase(password),
    hasNumber(password),
    hasSpecial(password),
    hasNoWhitespace(password),
  ].filter(Boolean).length;

  if (score <= 3) return "Schwach";
  if (score <= 5) return "Mittel";
  return "Stark";
}
