import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("proposal creates relation without browser access or membership backfill", async () => {
  const sql = await read("../../../../../docs/sql/b15-21b0-team-season-year-groups-proposal.sql");
  assert.match(sql, /UNIQUE \(team_season_id, birth_year\)/i);
  assert.match(sql, /desired_team_season_id uuid NULL/i);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(sql, /REVOKE ALL PRIVILEGES.*PUBLIC, anon, authenticated/is);
  assert.match(sql, /SECURITY INVOKER/i);
  assert.match(sql, /REVOKE ALL ON FUNCTION.*PUBLIC, anon, authenticated/is);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION.*service_role/is);
  assert.doesNotMatch(sql, /UPDATE public\.membership_requests/i);
});

test("admin write checks permission and scope before service role", async () => {
  const actions = await read("../../../../app/admin/teams/actions.js");
  const source = actions.slice(actions.indexOf("saveTeamSeasonYearGroupsAction"));
  assert.ok(source.indexOf('loadAuthorizedTeamMutationContext("teams.edit")') < source.indexOf("createSupabaseAdminClient()"));
  assert.ok(source.indexOf("canAccessTeamOnServer") < source.indexOf("createSupabaseAdminClient()"));
  assert.match(source, /\.eq\("id", teamSeasonId\)\.eq\("team_id", teamId\)/);
});
