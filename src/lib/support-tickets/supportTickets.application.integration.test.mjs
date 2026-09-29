import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveAdminRoutePermission } from "../admin-auth/adminPermissionConfig.js";

const [repository, service, actions, listPage, detailPage, createPage] = await Promise.all([
  readFile(new URL("./supportTickets.repository.js", import.meta.url), "utf8"),
  readFile(new URL("./supportTickets.service.js", import.meta.url), "utf8"),
  readFile(new URL("../../app/admin/support/actions.js", import.meta.url), "utf8"),
  readFile(new URL("../../app/admin/support/page.js", import.meta.url), "utf8"),
  readFile(new URL("../../app/admin/support/[id]/page.js", import.meta.url), "utf8"),
  readFile(new URL("../../app/admin/support/new/page.js", import.meta.url), "utf8"),
]);

test("runtime permission resolver maps every support route and fails closed for unknown admin routes", () => {
  assert.deepEqual(
    [
      ["/admin/support", "support_tickets.view_own"],
      ["/admin/support/new", "support_tickets.create"],
      ["/admin/support/00000000-0000-0000-0000-000000000000", "support_tickets.view_own"],
    ].map(([route, permission]) => {
      const resolution = resolveAdminRoutePermission(route);
      return [resolution.matched, resolution.permission, permission];
    }),
    [
      [true, "support_tickets.view_own", "support_tickets.view_own"],
      [true, "support_tickets.create", "support_tickets.create"],
      [true, "support_tickets.view_own", "support_tickets.view_own"],
    ],
  );

  const unknown = resolveAdminRoutePermission("/admin/unknown-support-route");
  assert.equal(unknown.matched, false);
  assert.equal(unknown.permission, null);
});

test("support pages and actions always pass an explicit permission options object", () => {
  const combined = `${listPage}\n${detailPage}\n${createPage}\n${actions}`;
  assert.doesNotMatch(combined, /assertAdminActionPermission\(\)/);
  assert.match(listPage, /assertAdminActionPermission\(\{ requiredPermission: null \}\)/);
  assert.match(detailPage, /assertAdminActionPermission\(\{ requiredPermission: null \}\)/);
  assert.match(createPage, /requiredPermission: "support_tickets\.create"[\s\S]*role\?\.key === "superadmin"[\s\S]*notFound\(\)/);
});

test("repository own list and detail apply ownership before returning rows", () => {
  assert.match(repository, /findOwnTickets[\s\S]*\.eq\("created_by_profile_id", profileId\)/);
  assert.match(repository, /findTicketForOwner[\s\S]*\.eq\("id", ticketId\)\.eq\("created_by_profile_id", profileId\)/);
});

test("messages and events are separate reads reached only after parent authorization", () => {
  assert.match(service, /ticketResult[\s\S]*!ticketResult\.data[\s\S]*Promise\.all\(\[repository\.findMessagesForTicket/);
  assert.match(service, /repository\.findEventsForTicket\(db, ticketId\)/);
});

test("all three business writes use only the verified atomic RPCs", () => {
  assert.match(repository, /\.rpc\("create_support_ticket_atomic"/);
  assert.match(repository, /\.rpc\("append_support_ticket_reply_atomic"/);
  assert.match(repository, /\.rpc\("mutate_support_ticket_admin_atomic"/);
  assert.doesNotMatch(repository, /from\("support_tickets"\)\.(?:insert|update|delete|upsert)/);
  assert.doesNotMatch(repository, /from\("support_ticket_(?:messages|events)"\)\.(?:insert|update|delete|upsert)/);
});

test("create uses the authenticated profile and explicitly rejects superadmins", () => {
  assert.match(service, /if \(isSuperadmin\(auth\)\) return fail[\s\S]*Superadmins verwalten Support-Tickets/);
  assert.match(service, /actorProfileId: auth\.profile\.id/);
  assert.doesNotMatch(repository, /input\.actorProfileId[^\n]*input\.actorProfileId[^\n]*input\.actorProfileId/);
});

test("create requires permission and validates area against server-derived scopes", () => {
  assert.match(service, /can\(auth, "create"\)/);
  assert.match(service, /loadAdminProfileScopeContext|scopeLoader/);
  assert.match(service, /findAllowedTicketArea\(areas\.data, validation\.value\.areaKey\)/);
  assert.match(service, /context\.managedDepartmentId/);
  assert.match(service, /context\.assignedTeamIds/);
});

test("normal list/detail/reply paths use own permissions and owner queries", () => {
  assert.match(service, /can\(auth, "viewOwn"\)/);
  assert.match(service, /findOwnTickets\(db, auth\.profile\.id/);
  assert.match(service, /findTicketForOwner\(db, ticketId, auth\.profile\.id\)/);
  assert.match(service, /can\(auth, "replyOwn"\)/);
  assert.match(service, /findTicketForOwner\(db, validation\.value\.ticketId, auth\.profile\.id\)/);
});

test("reply rejects completed before invoking the atomic RPC and actor is server-owned", () => {
  assert.match(service, /canReplyToTicketStatus\(ticket\.data\.status\)[\s\S]*appendTicketReplyAtomic/);
  assert.match(service, /appendTicketReplyAtomic\(db, \{ \.\.\.validation\.value, actorProfileId: auth\.profile\.id \}\)/);
});

test("superadmin manage path supports global read and the admin RPC only", () => {
  assert.match(service, /const manage = can\(auth, "manage"\)/);
  assert.match(service, /findAllTicketsForSupport/);
  assert.match(service, /mutateTicketAdminAtomic/);
  assert.match(service, /findAssignableProfiles/);
});

test("normal users cannot reach status, priority or assignment mutation action", () => {
  assert.match(actions, /mutateSupportTicketAdminAction[\s\S]*assertSuperadminActionPermission\(\{ requiredPermission: "support_tickets\.manage" \}\)/);
  assert.match(actions, /loadSupportTicketAssigneesAction[\s\S]*assertSuperadminActionPermission/);
});

test("every action reauthorizes server-side", () => {
  for (const name of ["loadOwnSupportTicketsAction", "loadSupportTicketsForAdminAction", "loadSupportTicketDetailAction", "loadSupportTicketAreasAction", "createSupportTicketAction", "replySupportTicketAction", "mutateSupportTicketAdminAction", "loadSupportTicketAssigneesAction"]) {
    const start = actions.indexOf(`function ${name}`);
    assert.notEqual(start, -1, `${name} exists`);
    const next = actions.indexOf("export async function", start + 10);
    const body = actions.slice(start, next === -1 ? undefined : next);
    assert.match(body, /assert(?:Admin|Superadmin)ActionPermission/);
  }
});

test("service returns generic IDOR-safe and database-safe errors", () => {
  assert.match(service, /Ticket nicht gefunden oder kein Zugriff\./);
  assert.doesNotMatch(service, /error\.message|error\.details|error\.hint/);
});

test("application layer leaves audit writes to RPCs and notifications to the central pipeline", () => {
  const combined = `${repository}\n${service}\n${actions}`;
  assert.doesNotMatch(combined, /\.from\("support_ticket_events"\)\.insert/);
  assert.match(service, /notifySupportTicketWorkflow/);
  assert.doesNotMatch(combined, /sendMail|deliverNotificationEmail|resend/i);
});
