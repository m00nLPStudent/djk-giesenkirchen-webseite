import {
  CONTRIBUTION_KEY_OPTIONS,
  CONTRIBUTION_STATUS_OPTIONS,
} from "./contributionOptions.js";

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatContributionAmount(value = "0.00") {
  return euroFormatter.format(Number.parseFloat(value || "0") || 0);
}

export function formatContributionDate(value) {
  if (!value) return "-";
  return dateFormatter.format(new Date(value));
}

export function formatContributionDateTime(value) {
  if (!value) return "-";
  return dateTimeFormatter.format(new Date(value));
}

export function getContributionKeyLabel(value = "") {
  return (
    CONTRIBUTION_KEY_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "Unbekannt"
  );
}

const COMPACT_STATUS_LABELS = {
  partially_paid: "Teilbezahlt",
};

const EXTRA_STATUS_LABELS = {
  none: "Kein Beitrag",
  overdue: "Ueberfaellig",
};

export function getContributionStatusLabel(value = "", options = {}) {
  if (EXTRA_STATUS_LABELS[value]) {
    return EXTRA_STATUS_LABELS[value];
  }

  if (options.compact && COMPACT_STATUS_LABELS[value]) {
    return COMPACT_STATUS_LABELS[value];
  }

  return (
    CONTRIBUTION_STATUS_OPTIONS.find((option) => option.value === value)?.label ||
    value ||
    "Unbekannt"
  );
}

const PAYMENT_METHOD_LABELS = {
  transfer: "Ueberweisung",
  cash: "Barzahlung",
  card: "Karte",
  direct_debit: "Lastschrift",
};

export function getContributionPaymentMethodLabel(value = "") {
  const normalized = String(value || "").trim();

  return PAYMENT_METHOD_LABELS[normalized] || normalized || "Keine Zahlungsart";
}

export function escapeCsvValue(value = "") {
  const stringValue = String(value ?? "");
  const neutralized = /^[=+\-@]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue;
  const escaped = neutralized.replace(/"/g, '""');
  return `"${escaped}"`;
}
