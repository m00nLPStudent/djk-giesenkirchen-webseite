import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("submit resolves season selection server-side and derives master team", async () => {
  const service = await read("./membership.service.js");
  const core = await read("./membershipSubmit.core.mjs");
  assert.match(service, /resolveMembershipFootballTeamSelection/);
  assert.match(core, /resolveTeamSeasonSelection\(birthdate, desiredTeamSeasonId\)/);
  assert.match(core, /desiredTeamId = selected\.data\.teamId/);
  assert.match(core, /desiredTeamSeasonId = selected\.data\.teamSeasonId/);
  assert.doesNotMatch(core, /source\.desired_team_id/);
});

test("request-type proposal preserves legacy values without data rewrites", async () => {
  const sql = await read("../../../docs/sql/b15-21b3-membership-request-types-proposal.sql");
  for (const value of ["aktives-mitglied-tischtennis", "aktives-mitglied-gymnastik-damen", "aktives-mitglied-behindertensport", "sonstiges"]) assert.match(sql, new RegExp(value));
  assert.doesNotMatch(sql, /UPDATE|DELETE FROM|INSERT INTO/i);
  assert.match(sql, /RAISE EXCEPTION/);
});

test("admin loader includes seasonal team and season without changing notification payload", async () => {
  const loader = await read("../../components/admin/membership/membershipRequests.loader.js");
  assert.match(loader, /team_seasons\(name_de, seasons\(name\)\)/);
  const notifications = await read("../../components/admin/notifications/workflowNotification.core.mjs");
  assert.doesNotMatch(notifications, /birthdate|privacy_consent/);
});
