export function normalizeEditorValue(value) {
  return typeof value === "string" ? value : "";
}

export function isEditorValueEmpty(value) {
  return normalizeEditorValue(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .trim().length === 0;
}
