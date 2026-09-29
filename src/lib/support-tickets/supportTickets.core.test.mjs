import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_REPLY_STATUSES,
  SUPPORT_TICKET_STATUSES,
  authorizeSupportTicketCapability,
  buildTicketArea,
  canReplyToTicketStatus,
  findAllowedTicketArea,
  normalizeTicketCategory,
  normalizeTicketPriority,
  normalizeTicketStatus,
  validateAdminMutationInput,
  validateCreateTicketInput,
  validateReplyInput,
  validateTicketMessage,
  validateTicketSubject,
} from "./supportTickets.core.mjs";

const ID = "11111111-1111-4111-8111-111111111111";

test("uses the exact database status, priority and category allowlists", () => {
  assert.deepEqual(SUPPORT_TICKET_STATUSES, ["open", "in_progress", "waiting_for_response", "completed"]);
  assert.deepEqual(SUPPORT_TICKET_REPLY_STATUSES, ["open", "in_progress", "waiting_for_response"]);
  assert.deepEqual(SUPPORT_TICKET_PRIORITIES, ["low", "normal", "high", "urgent"]);
  assert.deepEqual(SUPPORT_TICKET_CATEGORIES, ["problem", "question", "improvement", "other"]);
});

test("normalizes valid enum inputs and rejects unknown values", () => {
  assert.deepEqual(normalizeTicketStatus(" in_progress "), { ok: true, value: "in_progress" });
  assert.deepEqual(normalizeTicketPriority(" urgent "), { ok: true, value: "urgent" });
  assert.deepEqual(normalizeTicketCategory(" question "), { ok: true, value: "question" });
  assert.equal(normalizeTicketStatus("deleted").ok, false);
  assert.equal(normalizeTicketPriority("critical").ok, false);
  assert.equal(normalizeTicketCategory("incident").ok, false);
});

test("subject follows the database trim and 3..200 contract", () => {
  assert.deepEqual(validateTicketSubject("  Hilfe  "), { ok: true, value: "Hilfe" });
  assert.equal(validateTicketSubject("ab").ok, false);
  assert.equal(validateTicketSubject("x".repeat(201)).ok, false);
  assert.equal(validateTicketSubject("x".repeat(200)).ok, true);
});

test("message follows the database trim and 1..10000 contract", () => {
  assert.deepEqual(validateTicketMessage("  Nachricht  "), { ok: true, value: "Nachricht" });
  assert.equal(validateTicketMessage("   ").ok, false);
  assert.equal(validateTicketMessage("x".repeat(10001)).ok, false);
  assert.equal(validateTicketMessage("x".repeat(10000)).ok, true);
});

test("builds only canonical organization, department and team areas", () => {
  assert.deepEqual(buildTicketArea({ type: "organization" }), { key: "organization:general", type: "organization", label: "Allgemein", departmentId: null, teamId: null });
  assert.equal(buildTicketArea({ type: "department", id: ID, label: "Fußball" }).key, `department:${ID}`);
  assert.equal(buildTicketArea({ type: "team", id: ID, label: "D2" }).key, `team:${ID}`);
  assert.equal(buildTicketArea({ type: "team", id: "manipulated" }), null);
  assert.equal(buildTicketArea({ type: "custom", id: ID }), null);
});

test("matches a browser area only against the server allowlist", () => {
  const areas = [buildTicketArea({ type: "organization" }), buildTicketArea({ type: "team", id: ID })];
  assert.equal(findAllowedTicketArea(areas, ` TEAM:${ID.toUpperCase()} `)?.teamId, ID);
  assert.equal(findAllowedTicketArea(areas, "team:22222222-2222-4222-8222-222222222222"), null);
});

test("create input does not accept actor, priority or scope ids as business input", () => {
  const result = validateCreateTicketInput({ subject: " Hilfe ", message: " Text ", category: "problem", areaKey: "organization:general", actorProfileId: "attacker", priority: "urgent", teamId: ID });
  assert.deepEqual(result, { ok: true, value: { subject: "Hilfe", message: "Text", category: "problem", areaKey: "organization:general" } });
});

test("create input returns field-safe validation errors", () => {
  const result = validateCreateTicketInput({ subject: "x", message: "", category: "bad", areaKey: "" });
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.fieldErrors).sort(), ["areaKey", "category", "message", "subject"]);
});

test("reply requires a UUID and valid body and never accepts an actor", () => {
  assert.deepEqual(validateReplyInput({ ticketId: ID, message: " Antwort ", actorProfileId: "attacker" }), { ok: true, value: { ticketId: ID, message: "Antwort" } });
  assert.equal(validateReplyInput({ ticketId: "other", message: "Antwort" }).ok, false);
});

test("completed tickets are not replyable", () => {
  for (const status of ["open", "in_progress", "waiting_for_response"]) assert.equal(canReplyToTicketStatus(status), true);
  assert.equal(canReplyToTicketStatus("completed"), false);
});

test("admin mutation validates status, priority, assignment and a real mutation", () => {
  assert.equal(validateAdminMutationInput({ ticketId: ID, status: "open" }).ok, true);
  assert.equal(validateAdminMutationInput({ ticketId: ID, priority: "urgent" }).ok, true);
  assert.equal(validateAdminMutationInput({ ticketId: ID, changeAssignment: true, assignedToProfileId: ID }).ok, true);
  assert.equal(validateAdminMutationInput({ ticketId: ID }).ok, false);
  assert.equal(validateAdminMutationInput({ ticketId: ID, status: "invalid" }).ok, false);
  assert.equal(validateAdminMutationInput({ ticketId: ID, changeAssignment: true, assignedToProfileId: "invalid" }).ok, false);
});

test("normal active users receive only explicitly granted ticket capabilities", () => {
  const context = { isActive: true, roleKeys: ["trainer"], permissionKeys: ["support_tickets.view_own", "support_tickets.create", "support_tickets.reply_own"] };
  assert.equal(authorizeSupportTicketCapability(context, "create"), true);
  assert.equal(authorizeSupportTicketCapability(context, "viewOwn"), true);
  assert.equal(authorizeSupportTicketCapability(context, "replyOwn"), true);
  assert.equal(authorizeSupportTicketCapability(context, "manage"), false);
  assert.equal(authorizeSupportTicketCapability({ ...context, permissionKeys: [] }, "create"), false);
  assert.equal(authorizeSupportTicketCapability({ ...context, isActive: false }, "viewOwn"), false);
});

test("superadmin manages and replies globally but cannot create own tickets", () => {
  const context = { isActive: true, roleKeys: ["superadmin"], permissionKeys: ["support_tickets.manage"] };
  assert.equal(authorizeSupportTicketCapability(context, "manage"), true);
  assert.equal(authorizeSupportTicketCapability(context, "viewOwn"), true);
  assert.equal(authorizeSupportTicketCapability(context, "replyOwn"), true);
  assert.equal(authorizeSupportTicketCapability(context, "create"), false);
  assert.equal(authorizeSupportTicketCapability({ ...context, permissionKeys: [] }, "manage"), false);
});
