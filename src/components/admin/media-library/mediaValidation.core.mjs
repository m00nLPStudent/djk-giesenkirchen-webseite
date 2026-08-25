export const MEDIA_BUCKETS = Object.freeze({ public: "media-library-public", admin: "media-library-private", restricted: "media-library-private" });
export const MEDIA_VISIBILITIES = Object.freeze(["public", "admin", "restricted"]);
export const MEDIA_KINDS = Object.freeze(["image", "document"]);
export { MEDIA_PURPOSES } from "./mediaPurpose.config.mjs";
import { MEDIA_PURPOSES } from "./mediaPurpose.config.mjs";

const TYPES = Object.freeze({
  "image/jpeg": { extension: "jpg", kind: "image", max: 10 * 1024 * 1024, signatures: [[0xff, 0xd8, 0xff]] },
  "image/png": { extension: "png", kind: "image", max: 10 * 1024 * 1024, signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]] },
  "image/webp": { extension: "webp", kind: "image", max: 10 * 1024 * 1024, signatures: [[0x52, 0x49, 0x46, 0x46]] },
  "application/pdf": { extension: "pdf", kind: "document", max: 20 * 1024 * 1024, signatures: [[0x25, 0x50, 0x44, 0x46, 0x2d]] },
});

const cleanText = (value, max) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) || null;
const startsWith = (bytes, signature) => signature.every((value, index) => bytes[index] === value);

export function normalizeMediaMetadata(input = {}) {
  const visibility = MEDIA_VISIBILITIES.includes(input.visibility) ? input.visibility : "admin";
  return {
    displayName: cleanText(input.displayName, 200), altText: cleanText(input.altText, 500),
    description: cleanText(input.description, 2000), copyrightNotice: cleanText(input.copyrightNotice, 500),
    sourceLabel: cleanText(input.sourceLabel, 300), visibility,
    purpose: MEDIA_PURPOSES.includes(input.purpose) ? input.purpose : "document",
  };
}

export function validateMediaDescriptor({ name = "", type = "", size = 0, bytes = [] } = {}) {
  const definition = TYPES[String(type).toLowerCase()];
  if (!definition) return { ok: false, error: "Nur JPEG-, PNG-, WebP-Bilder und PDF-Dokumente sind erlaubt." };
  if (!Number.isSafeInteger(size) || size <= 0 || size > definition.max) return { ok: false, error: `Die Datei ist leer oder größer als ${definition.max / 1024 / 1024} MB.` };
  if (!definition.signatures.some((signature) => startsWith(bytes, signature))) return { ok: false, error: "Dateiinhalt und MIME-Typ stimmen nicht überein." };
  if (definition.extension === "webp" && String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP") return { ok: false, error: "Ungültige WebP-Datei." };
  return { ok: true, extension: definition.extension, mediaKind: definition.kind, originalFilename: cleanText(name, 255) || `datei.${definition.extension}`, maxBytes: definition.max };
}

export function createMediaStoragePath({ purpose, id, extension, mediaKind }) {
  const root = mediaKind === "image" ? "images" : "documents";
  return `${root}/${MEDIA_PURPOSES.includes(purpose) ? purpose : "document"}/${id}.${extension}`;
}
