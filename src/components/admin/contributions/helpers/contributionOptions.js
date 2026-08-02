export const CONTRIBUTION_KEY_OPTIONS = [
  { value: "regular", label: "Jahresbeitrag" },
  { value: "admission_fee", label: "Aufnahmegebuehr" },
  { value: "adjustment", label: "Nachberechnung" },
  { value: "correction", label: "Korrektur" },
  { value: "special_fee", label: "Sonderbeitrag" },
];

export const CONTRIBUTION_STATUS_OPTIONS = [
  { value: "open", label: "Offen" },
  { value: "partially_paid", label: "Teilweise bezahlt" },
  { value: "paid", label: "Bezahlt" },
  { value: "deferred", label: "Gestundet" },
  { value: "exempt", label: "Befreit" },
  { value: "canceled", label: "Storniert" },
];

export const CONTRIBUTION_SORT_OPTIONS = [
  { value: "default", label: "Standard" },
  { value: "player_name", label: "Spielername" },
  { value: "due_date", label: "Faelligkeit" },
  { value: "status", label: "Status" },
  { value: "amount_due", label: "Sollbetrag" },
  { value: "amount_outstanding", label: "Offener Betrag" },
  { value: "last_payment", label: "Letzte Zahlung" },
  { value: "created_at", label: "Erstellungsdatum" },
];

export const CONTRIBUTION_AMOUNT_SUMMARY_CONFIG = [
  {
    key: "totalDue",
    title: "Gesamtsoll",
    compactTitle: "Soll",
  },
  {
    key: "totalPaid",
    title: "Gesamtgezahlt",
    compactTitle: "Gezahlt",
  },
  {
    key: "totalWaived",
    title: "Gesamterlassen",
    compactTitle: "Erlassen",
  },
  {
    key: "totalOutstanding",
    title: "Gesamtoffen",
    compactTitle: "Offen",
    emphasis: true,
  },
];
