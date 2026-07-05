export const SETTINGS_TABS = [
  { id: "club", label: "Vereinsdaten" },
  { id: "contacts", label: "Allgemeine Kontakte" },
  { id: "membership", label: "Mitglied werden" },
  { id: "pages", label: "Seiten" },
];

export const MEMBERSHIP_SUBVIEWS = [
  { id: "recipients", label: "Empfänger" },
  { id: "requests", label: "Mitgliedsanfragen" },
];

export const MEMBERSHIP_REQUEST_TYPE_OPTIONS = [
  { value: "", label: "Alle Anfragearten" },
  { value: "aktives-mitglied-fussball", label: "Aktives Mitglied Fußball" },
  { value: "trainer-werden", label: "Trainer werden" },
  { value: "passives-mitglied", label: "Passives Mitglied" },
  { value: "sonstiges", label: "Sonstiges" },
];

export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: "new", label: "Neu" },
  { value: "in_progress", label: "In Bearbeitung" },
  { value: "done", label: "Erledigt" },
];

export const MEMBERSHIP_FORWARD_TYPE_OPTIONS = [
  { value: "coach", label: "Trainer" },
  { value: "board", label: "Vorstand" },
];

export const CONTACT_CATEGORY_OPTIONS = [
  { value: "allgemein", label: "Allgemein" },
  { value: "vorstand-verein", label: "Vorstand Verein" },
  { value: "vorstand-fussball", label: "Vorstand Fußball" },
  { value: "jugend", label: "Jugend" },
  { value: "platzanlage", label: "Platzanlage" },
  { value: "web-medien", label: "Web / Medien" },
  { value: "verwaltung", label: "Verwaltung" },
];

export const ROLE_TEMPLATES = [
  {
    value: "jugendschutzbeauftragter",
    role_de: "Jugendschutzbeauftragter",
    role_en: "Youth Protection Officer",
  },
  { value: "platzwart", role_de: "Platzwart", role_en: "Groundskeeper" },
  { value: "webmaster", role_de: "Webmaster", role_en: "Webmaster" },
  {
    value: "vorsitzender-verein",
    role_de: "1. Vorsitzender Verein",
    role_en: "1st Chairman Club",
  },
  {
    value: "vorsitzender-fussball",
    role_de: "1. Vorsitzender Fußball",
    role_en: "1st Chairman Football",
  },
  {
    value: "geschaeftsfuehrer-verein",
    role_de: "Geschäftsführer Verein",
    role_en: "Managing Director Club",
  },
  {
    value: "geschaeftsfuehrer-fussball",
    role_de: "Geschäftsführer Fußball",
    role_en: "Managing Director Football",
  },
  { value: "jugendleiter", role_de: "Jugendleiter", role_en: "Head of Youth" },
  { value: "kassierer", role_de: "Kassierer", role_en: "Treasurer" },
  {
    value: "presse",
    role_de: "Presse / Öffentlichkeitsarbeit",
    role_en: "Press / Public Relations",
  },
  { value: "sonstiges", role_de: "", role_en: "" },
];

export const ROLE_TEMPLATE_BY_VALUE = ROLE_TEMPLATES.reduce((map, entry) => {
  map[entry.value] = entry;
  return map;
}, {});

export function getMembershipRequestTypeLabel(value = "") {
  return (
    MEMBERSHIP_REQUEST_TYPE_OPTIONS.find((item) => item.value === value)
      ?.label ||
    value ||
    "Alle Anfragearten"
  );
}

export function getMembershipStatusLabel(value = "new") {
  return (
    MEMBERSHIP_STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value
  );
}

export function getMembershipForwardTypeLabel(value = "") {
  return (
    MEMBERSHIP_FORWARD_TYPE_OPTIONS.find((item) => item.value === value)
      ?.label ||
    value ||
    "-"
  );
}

export function getCategoryLabel(category) {
  return (
    CONTACT_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ||
    category ||
    "Allgemein"
  );
}
