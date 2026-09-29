import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { ADMIN_NAVIGATION_SECTIONS } from "../navigation/adminNavigation.config.js";
import { resolveAdminNavigation } from "../navigation/adminNavigation.resolver.js";

const [list, create, detail, listPage, createPage, detailPage, permissions] = await Promise.all([
  readFile(new URL("./SupportTicketsModule.js", import.meta.url), "utf8"),
  readFile(new URL("./SupportTicketCreateForm.js", import.meta.url), "utf8"),
  readFile(new URL("./SupportTicketDetail.js", import.meta.url), "utf8"),
  readFile(new URL("../../../app/admin/support/page.js", import.meta.url), "utf8"),
  readFile(new URL("../../../app/admin/support/new/page.js", import.meta.url), "utf8"),
  readFile(new URL("../../../app/admin/support/[id]/page.js", import.meta.url), "utf8"),
  readFile(new URL("../../../lib/admin-auth/adminPermissionConfig.js", import.meta.url), "utf8"),
]);

const scope = { isGlobal: true, roleScopeTypes: ["global"], assignedTeamIds: [] };
const keys = (permissionsForUser, roles = []) => resolveAdminNavigation({
  sections: ADMIN_NAVIGATION_SECTIONS,
  permissionKeys: permissionsForUser,
  roleKeys: roles,
  scopeContext: scope,
}).sections.flatMap((section) => section.items.map((item) => item.key));

test("support navigation is permission based for normal users and superadmins", () => {
  assert.ok(keys(["support_tickets.view_own"]).includes("support"));
  assert.ok(keys(["support_tickets.manage"], ["superadmin"]).includes("support"));
  assert.ok(!keys([]).includes("support"));
  assert.match(permissions, /\/admin\/support\/new[\s\S]*support_tickets\.create/);
  assert.match(permissions, /\/admin\/support[\s\S]*support_tickets\.view_own/);
});

test("ticket overview uses a desktop list and mobile cards without a superadmin create CTA", () => {
  assert.match(list, /hidden overflow-hidden xl:block/);
  assert.match(list, /AdminModuleCards className="xl:hidden"/);
  assert.match(list, /canCreate && !isSuperadmin/);
  assert.match(list, /Ticketnummer|ticketNumber/);
  assert.match(list, /Letzte Aktivität/);
  assert.match(listPage, /loadAllTicketsForSupport|listTickets/);
});

test("create form exposes only allowlisted category, area, subject and message inputs", () => {
  for (const name of ["category", "areaKey", "subject", "message"]) assert.match(create, new RegExp(`name="${name}"`));
  for (const forbidden of ["priority", "status", "assignedToProfileId", "actorProfileId"]) assert.doesNotMatch(create, new RegExp(`name="${forbidden}"`));
  assert.match(create, /SUPPORT_TICKET_CATEGORIES\.map/);
  assert.match(create, /areas\.map/);
  assert.match(create, /disabled=\{pending \|\| !areas\.length\}/);
  assert.match(create, /router\.push\(`\/admin\/support\/\$\{response\.data\.ticketId\}`\)/);
  assert.match(createPage, /support_tickets\.create/);
});

test("detail stays fail closed and renders messages as plain JSX text", () => {
  assert.match(detailPage, /getTicketDetail/);
  assert.match(detail, /Ticket nicht gefunden oder kein Zugriff/);
  assert.match(detail, /whitespace-pre-wrap break-words/);
  assert.doesNotMatch(detail, /dangerouslySetInnerHTML/);
  assert.match(detail, /message\.body/);
});

test("completed tickets have no reply form until superadmin explicitly reopens them", () => {
  assert.match(detail, /canReplyToTicketStatus\(ticket\.status\)/);
  assert.match(detail, /replyAllowed \? <div className="mt-5"><ReplyForm/);
  assert.match(detail, /ticket\.status === "completed"/);
  assert.match(detail, /save\(\{ status: "open" \}\)/);
  assert.match(detail, /Öffne das Ticket zuerst wieder/);
});

test("superadmin controls use allowlisted status, priority and assignment options", () => {
  assert.match(detail, /SUPPORT_TICKET_STATUSES\.map/);
  assert.match(detail, /SUPPORT_TICKET_PRIORITIES\.map/);
  assert.match(detail, /assignees\.map/);
  assert.doesNotMatch(detail, /name="assignedToProfileId"/);
  assert.match(detailPage, /listAssignableProfiles/);
});
