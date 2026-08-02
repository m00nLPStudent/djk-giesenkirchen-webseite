function normalizeRawAmount(value) {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return String(value).trim();
}

export function centsToDecimalString(cents = 0) {
  const normalized = Number.isInteger(cents) ? cents : 0;
  const sign = normalized < 0 ? "-" : "";
  const absolute = Math.abs(normalized);
  const euros = Math.floor(absolute / 100);
  const centsPart = String(absolute % 100).padStart(2, "0");
  return `${sign}${euros}.${centsPart}`;
}

export function addCents(values = []) {
  return (values || []).reduce((sum, value) => sum + (value || 0), 0);
}

export function parseEuroCents(value, { allowZero = true } = {}) {
  const raw = normalizeRawAmount(value).replace(/\s+/g, "").replace(",", ".");

  if (!raw) {
    return {
      ok: false,
      reason: "required",
      message: "Bitte einen Betrag angeben.",
    };
  }

  if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) {
    return {
      ok: false,
      reason: "format",
      message: "Betrag muss eine gueltige Zahl mit maximal zwei Nachkommastellen sein.",
    };
  }

  const negative = raw.startsWith("-");
  if (negative) {
    return {
      ok: false,
      reason: "negative",
      message: "Negative Betraege sind nicht erlaubt.",
    };
  }

  const [eurosPart, centsPart = ""] = raw.split(".");
  const cents = Number(eurosPart) * 100 + Number(centsPart.padEnd(2, "0"));

  if (!allowZero && cents <= 0) {
    return {
      ok: false,
      reason: "positive",
      message: "Der Betrag muss groesser als 0 sein.",
    };
  }

  return {
    ok: true,
    cents,
    decimal: centsToDecimalString(cents),
  };
}
