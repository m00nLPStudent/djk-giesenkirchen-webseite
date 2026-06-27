export function normalizeGermanPhoneNumber(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  if (digits.startsWith("49")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `49${digits.slice(1)}`;
  }

  return digits;
}

export function formatGermanPhoneNumber(value = "") {
  const normalized = normalizeGermanPhoneNumber(value);

  if (!normalized) return "";

  if (normalized.startsWith("49")) {
    return `0${normalized.slice(2)}`;
  }

  return normalized;
}

export function getWhatsAppUrl(value = "") {
  const normalized = normalizeGermanPhoneNumber(value);
  if (!normalized) return null;
  return `https://wa.me/${normalized}`;
}

export function getPhoneHref(value = "") {
  const normalized = normalizeGermanPhoneNumber(value);
  if (!normalized) return null;
  return `tel:+${normalized}`;
}
