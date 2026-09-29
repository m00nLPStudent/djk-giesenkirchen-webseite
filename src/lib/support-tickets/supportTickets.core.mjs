const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SUPPORT_TICKET_STATUSES = Object.freeze(["open", "in_progress", "waiting_for_response", "completed"]);
export const SUPPORT_TICKET_PRIORITIES = Object.freeze(["low", "normal", "high", "urgent"]);
export const SUPPORT_TICKET_CATEGORIES = Object.freeze(["problem", "question", "improvement", "other"]);
export const SUPPORT_TICKET_REPLY_STATUSES = Object.freeze(["open", "in_progress", "waiting_for_response"]);

export const SUPPORT_TICKET_LABELS = Object.freeze({
  status: { open: "Offen", in_progress: "In Bearbeitung", waiting_for_response: "Wartet auf Rückmeldung", completed: "Abgeschlossen" },
  priority: { low: "Niedrig", normal: "Normal", high: "Hoch", urgent: "Dringend" },
  category: { problem: "Problem", question: "Frage", improvement: "Verbesserung", other: "Sonstiges" },
});

export const SUPPORT_TICKET_ERROR_CODES = Object.freeze({
  INVALID_INPUT: "invalid_input",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found_or_forbidden",
  COMPLETED: "ticket_completed",
  CONFIGURATION: "service_unavailable",
  DATABASE: "database_error",
});

const text = (value) => String(value ?? "").trim();
export const isSupportTicketUuid = (value) => UUID_PATTERN.test(text(value));

function validateText(value, field, min, max, message) {
  const normalized = text(value);
  return normalized.length >= min && normalized.length <= max
    ? { ok: true, value: normalized }
    : { ok: false, field, message };
}

export function validateTicketSubject(value) {
  return validateText(value, "subject", 3, 200, "Der Betreff muss zwischen 3 und 200 Zeichen lang sein.");
}

export function validateTicketMessage(value) {
  return validateText(value, "message", 1, 10000, "Die Nachricht muss zwischen 1 und 10.000 Zeichen lang sein.");
}

export function normalizeTicketCategory(value) {
  const normalized = text(value);
  return SUPPORT_TICKET_CATEGORIES.includes(normalized)
    ? { ok: true, value: normalized }
    : { ok: false, field: "category", message: "Bitte eine gültige Ticketart wählen." };
}

export function normalizeTicketStatus(value, { optional = false } = {}) {
  const normalized = text(value);
  if (optional && !normalized) return { ok: true, value: null };
  return SUPPORT_TICKET_STATUSES.includes(normalized)
    ? { ok: true, value: normalized }
    : { ok: false, field: "status", message: "Bitte einen gültigen Status wählen." };
}

export function normalizeTicketPriority(value, { optional = false } = {}) {
  const normalized = text(value);
  if (optional && !normalized) return { ok: true, value: null };
  return SUPPORT_TICKET_PRIORITIES.includes(normalized)
    ? { ok: true, value: normalized }
    : { ok: false, field: "priority", message: "Bitte eine gültige Priorität wählen." };
}

export function buildTicketArea({ type, id = null, label = "" } = {}) {
  if (type === "organization") return { key: "organization:general", type, label: label || "Allgemein", departmentId: null, teamId: null };
  if (type === "department" && isSupportTicketUuid(id)) return { key: `department:${text(id).toLowerCase()}`, type, label: text(label) || "Abteilung", departmentId: text(id).toLowerCase(), teamId: null };
  if (type === "team" && isSupportTicketUuid(id)) return { key: `team:${text(id).toLowerCase()}`, type, label: text(label) || "Mannschaft", departmentId: null, teamId: text(id).toLowerCase() };
  return null;
}

export function findAllowedTicketArea(areas = [], requestedKey = "") {
  const key = text(requestedKey).toLowerCase();
  return (areas || []).find((area) => area?.key === key) || null;
}

export function validateCreateTicketInput(input = {}) {
  const subject = validateTicketSubject(input.subject);
  const message = validateTicketMessage(input.message);
  const category = normalizeTicketCategory(input.category);
  const areaKey = text(input.areaKey).toLowerCase();
  const fieldErrors = {};
  for (const result of [subject, message, category]) if (!result.ok) fieldErrors[result.field] = result.message;
  if (!areaKey) fieldErrors.areaKey = "Bitte einen gültigen Bereich wählen.";
  return Object.keys(fieldErrors).length
    ? { ok: false, fieldErrors }
    : { ok: true, value: { subject: subject.value, message: message.value, category: category.value, areaKey } };
}

export function validateReplyInput(input = {}) {
  const ticketId = text(input.ticketId);
  const message = validateTicketMessage(input.message);
  const fieldErrors = {};
  if (!isSupportTicketUuid(ticketId)) fieldErrors.ticketId = "Das Ticket ist ungültig.";
  if (!message.ok) fieldErrors.message = message.message;
  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, value: { ticketId, message: message.value } };
}

export function validateAdminMutationInput(input = {}) {
  const ticketId = text(input.ticketId);
  const status = normalizeTicketStatus(input.status, { optional: true });
  const priority = normalizeTicketPriority(input.priority, { optional: true });
  const changeAssignment = input.changeAssignment === true;
  const assigneeId = text(input.assignedToProfileId) || null;
  const fieldErrors = {};
  if (!isSupportTicketUuid(ticketId)) fieldErrors.ticketId = "Das Ticket ist ungültig.";
  if (!status.ok) fieldErrors.status = status.message;
  if (!priority.ok) fieldErrors.priority = priority.message;
  if (changeAssignment && assigneeId && !isSupportTicketUuid(assigneeId)) fieldErrors.assignedToProfileId = "Die Zuweisung ist ungültig.";
  if (!status.value && !priority.value && !changeAssignment) fieldErrors.mutation = "Es wurde keine Änderung ausgewählt.";
  return Object.keys(fieldErrors).length ? { ok: false, fieldErrors } : { ok: true, value: { ticketId, status: status.value, priority: priority.value, assignedToProfileId: assigneeId, changeAssignment } };
}

export function canReplyToTicketStatus(status) {
  return SUPPORT_TICKET_REPLY_STATUSES.includes(status);
}

const CAPABILITY_PERMISSION = Object.freeze({
  create: "support_tickets.create",
  viewOwn: "support_tickets.view_own",
  replyOwn: "support_tickets.reply_own",
  manage: "support_tickets.manage",
});

export function authorizeSupportTicketCapability(context = {}, capability = "") {
  const roles = new Set((context.roleKeys || []).filter(Boolean));
  const permissions = new Set((context.permissionKeys || []).filter(Boolean));
  const superadmin = roles.has("superadmin");
  if (context.isActive === false) return false;
  if (!(capability in CAPABILITY_PERMISSION)) return false;
  if (capability === "create" && superadmin) return false;
  if (capability === "manage") return superadmin && permissions.has(CAPABILITY_PERMISSION.manage);
  if (superadmin) return true;
  return permissions.has(CAPABILITY_PERMISSION[capability]);
}
