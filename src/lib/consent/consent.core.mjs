export const CONSENT_VERSION = "1";
export const CONSENT_STORAGE_KEY = "djk-vfl-giesenkirchen-consent";

export const DEFAULT_CONSENT = Object.freeze({ version: CONSENT_VERSION, necessary: true, externalMedia: false, updatedAt: null });

export function parseStoredConsent(raw) {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || Object.getPrototypeOf(value) !== Object.prototype || value.version !== CONSENT_VERSION || value.necessary !== true || typeof value.externalMedia !== "boolean" || typeof value.updatedAt !== "string" || Number.isNaN(Date.parse(value.updatedAt))) return null;
    return { version: CONSENT_VERSION, necessary: true, externalMedia: value.externalMedia, updatedAt: value.updatedAt };
  } catch {
    return null;
  }
}

export function createConsent(externalMedia, now = new Date()) {
  return { version: CONSENT_VERSION, necessary: true, externalMedia: externalMedia === true, updatedAt: now.toISOString() };
}
