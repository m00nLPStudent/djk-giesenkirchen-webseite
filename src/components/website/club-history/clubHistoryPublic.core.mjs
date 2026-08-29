export function isPublicClubHistoryPage(page, now = Date.now()) {
  if (!page?.is_active || !page?.is_published) return false;
  if (!page.published_at) return true;
  const publishedAt = new Date(page.published_at).getTime();
  return Number.isFinite(publishedAt) && publishedAt <= now;
}

export function pickLocalizedHistoryValue(deValue, enValue, fallback = "") {
  const de = typeof deValue === "string" ? deValue.trim() : deValue;
  const en = typeof enValue === "string" ? enValue.trim() : enValue;
  return de || en || fallback;
}

export function formatHistoryYearRange(from, to) {
  const yearFrom = Number(from || 0);
  const yearTo = Number(to || 0);
  if (!yearFrom) return "-";
  if (!yearTo || yearTo === yearFrom) return String(yearFrom);
  return `${yearFrom}–${yearTo}`;
}

const HISTORY_NAMED_ENTITIES = Object.freeze({
  amp: "&",
  auml: "ä",
  Auml: "Ä",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
  szlig: "ß",
  nbsp: " ",
});

export function decodeHistoryTextEntities(value) {
  if (typeof value !== "string" || !value.includes("&")) return value || "";

  return value.replace(/&([A-Za-z]+|#\d{1,7}|#x[0-9A-Fa-f]{1,6});/g, (entity, key) => {
    if (Object.hasOwn(HISTORY_NAMED_ENTITIES, key)) return HISTORY_NAMED_ENTITIES[key];
    if (!key.startsWith("#")) return entity;

    const codePoint = key[1]?.toLowerCase() === "x"
      ? Number.parseInt(key.slice(2), 16)
      : Number.parseInt(key.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 32 || codePoint > 0x10ffff || [38, 60, 62].includes(codePoint)) return entity;

    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return entity;
    }
  });
}
