const HEADER_BREAKS = /[\r\n]+/g;

export function escapeMailHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export function normalizeMailHeader(value = "") {
  return String(value).replace(HEADER_BREAKS, " ").trim();
}

export function createMailIdempotencyKey(eventType, entityId) {
  const event = String(eventType || "").trim();
  const entity = String(entityId || "").trim();
  return event && entity ? `${event}/${entity}` : "";
}

export function validateMailMessage(message = {}) {
  const normalized = {
    to: String(message.to || "").trim().toLowerCase(),
    subject: normalizeMailHeader(message.subject),
    text: String(message.text || "").trim(),
    html: String(message.html || "").trim(),
    idempotencyKey: normalizeMailHeader(message.idempotencyKey),
  };
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.to)
    && normalized.subject && normalized.text && normalized.html && normalized.idempotencyKey;
  return valid
    ? { data: normalized, error: null }
    : { data: null, error: { code: "invalid_mail_message", message: "Mailnachricht ist unvollständig." } };
}

export function safeMailFailure(code = "mail_delivery_failed") {
  return { ok: false, status: "failed", error: { code, message: "Mailversand nicht erfolgreich." } };
}
