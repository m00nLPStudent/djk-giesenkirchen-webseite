export const MEDIA_PURPOSE_OPTIONS = Object.freeze([
  { key: "player", label: "Spieler", mediaKind: "image", pickerFilterable: true },
  { key: "coach", label: "Trainer", mediaKind: "image", pickerFilterable: true },
  { key: "board", label: "Vorstand", mediaKind: "image", pickerFilterable: true },
  { key: "team", label: "Mannschaft", mediaKind: "image", pickerFilterable: true },
  { key: "news", label: "News", mediaKind: "image", pickerFilterable: true },
  { key: "cms", label: "CMS / Vereinskontakt", mediaKind: "image", pickerFilterable: true },
  { key: "club_history", label: "Vereinsgeschichte", mediaKind: "image", pickerFilterable: true },
  { key: "sponsor", label: "Sponsor", mediaKind: "image", pickerFilterable: true },
  { key: "event", label: "Event / Termin", mediaKind: "image", pickerFilterable: true },
  { key: "document", label: "Dokument", mediaKind: "document", pickerFilterable: true },
  { key: "download", label: "Download", mediaKind: "document", pickerFilterable: true },
  { key: "system", label: "System", mediaKind: "image", pickerFilterable: true },
]);

export const MEDIA_PURPOSES = Object.freeze(MEDIA_PURPOSE_OPTIONS.map((option) => option.key));
export function getPickerPurposeOptions(mediaKind = "image") { return MEDIA_PURPOSE_OPTIONS.filter((option) => option.pickerFilterable && option.mediaKind === mediaKind); }
export function normalizePickerPurpose(value, fallback) { return value === "all" || getPickerPurposeOptions("image").some((option) => option.key === value) ? value : fallback; }
export function getDefaultPurposeForUsageContext(context) { return context === "board_member" ? "board" : context === "club_contact" ? "cms" : context; }
