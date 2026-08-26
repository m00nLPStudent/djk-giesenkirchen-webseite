import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const seed = read("../../../../docs/sql/admin-auth-seed.sql");
const mediaService = read("./media.service.js");
const domainActions = Object.freeze({
  players: read("../../../app/admin/players/actions.js"), coaches: read("../../../app/admin/coaches/actions.js"),
  board: read("../../../app/admin/department/board/actions.js"), contacts: read("../../../app/admin/settings/contacts/actions.js"),
  teams: read("../../../app/admin/teams/actions.js"), news: read("../../../app/admin/news/actions.js"),
  events: read("../../../app/admin/events/actions.js"), sponsors: read("../../../app/admin/sponsors/actions.js"),
  history: read("../../../app/admin/club-history/actions.js"), media: read("../../../app/admin/media/actions.js"),
});

test("audit uses only the ten repository roles and existing media permissions", () => {
  for (const role of ["superadmin","vorstand","fussball-vorstand","jugendleiter","trainer","betreuer","redakteur","kassierer","webmaster","gast"]) assert.match(seed, new RegExp(`\\('${role}',`));
  for (const permission of ["players.edit","coaches.edit","teams.edit","news.edit","events.edit","sponsors.edit","club_history.edit","settings.edit","system.view"]) assert.match(seed, new RegExp(permission.replace(".", "\\.")));
});

test("every B15.19 domain action is server-only and authenticates through the central helper", () => {
  for (const [area, source] of Object.entries(domainActions)) {
    assert.match(source, /^"use server";/, `${area} must stay a server action module`);
    assert.match(source, /assertAdminActionPermission/, `${area} must authenticate the caller`);
  }
  assert.match(mediaService, /import "server-only"/);
  assert.match(mediaService, /createSupabaseAdminClient/);
});

test("domain pickers consistently allow admin only for media-manager roles and never restricted", () => {
  for (const area of ["players","coaches","board","contacts","teams","news","events","sponsors","history"]) {
    assert.match(domainActions[area], /canManageMedia/);
    assert.match(domainActions[area], /\["public", "admin"\][\s\S]*\["public"\]/);
    assert.doesNotMatch(domainActions[area], /allowed(?:Visibilities)?\s*=.*restricted/);
  }
  assert.match(mediaService, /\["superadmin", "webmaster"\]/);
});

test("direct fach uploads remain public and assignments reuse the central service", () => {
  for (const area of ["players","coaches","board","contacts","teams","news","events","sponsors","history"]) assert.match(domainActions[area], /visibility: "public"/);
  for (const area of ["players","coaches","board","contacts","teams","news","events","sponsors","history"]) assert.match(domainActions[area], /synchronizeMediaAssignment/);
});

test("board mutations and publish transitions require their dedicated permissions", () => {
  assert.doesNotMatch(domainActions.board, /boardMemberId \? "settings\.view" : "settings\.edit"/);
  assert.equal(domainActions.board.match(/requiredPermission: "settings\.edit"/g)?.length, 3);
  assert.match(domainActions.news, /requiredPermission: "news\.publish"/);
  assert.match(domainActions.events, /requiredPermission: "events\.publish"/);
  assert.match(domainActions.history, /requiredPermission: "club_history\.publish"/);
});
