import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("settings page authorizes teams.edit and scope before privileged reads", async () => {
  const page = await read("../../../../app/admin/settings/seasons-teams/page.js");
  assert.ok(page.indexOf('requiredPermission: "teams.edit"') < page.indexOf("createSupabaseAdminClient()"));
  assert.ok(page.indexOf("loadServerTeamScopeContext") < page.indexOf("loadSeasonTeamYearsAdminData(adminDb)"));
  assert.match(page, /filterScopedTeamsOnServer/);
});

test("client has no direct Supabase table or RPC access", async () => {
  const source = await read("./SeasonTeamYearsModule.js");
  assert.doesNotMatch(source, /from\(["']team_season_year_groups/);
  assert.doesNotMatch(source, /\.rpc\(/);
  assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_.*SERVICE/i);
  assert.match(source, /saveTeamSeasonYearGroupsAction/);
});

test("navigation and route use the existing permission architecture", async () => {
  const options = await read("../helpers/settingsOptions.js");
  const config = await read("../../../../lib/admin-auth/adminPermissionConfig.js");
  assert.match(options, /Saisons & Mannschaften/);
  assert.match(options, /seasons-teams[\s\S]*teams\.edit/);
  assert.match(config, /\/admin\/settings\/seasons-teams[\s\S]*teams\.edit/);
});

test("all required empty states and feedback are rendered", async () => {
  const source = await read("./SeasonTeamYearsModule.js");
  for (const text of ["Es ist noch keine Saison angelegt", "Dieser Saison sind noch keine Mannschaften zugeordnet", "Keine Jahrgänge", "Jahrgänge wurden gespeichert"]) assert.match(source, new RegExp(text));
});

test("uses compact responsive list rows and a row-local inline editor", async () => {
  const source = await read("./SeasonTeamYearsModule.js");
  for (const primitive of ["AdminModuleList", "AdminListHeader", "AdminListRow", "AdminListMobileCard"]) assert.match(source, new RegExp(primitive));
  for (const column of ["Mannschaft", "Bereich / Altersgruppe", "Jahrgänge", "Status", "Aktion"]) assert.match(source, new RegExp(column));
  assert.match(source, /data-inline-year-editor/);
  assert.match(source, /col-span-full/);
  assert.match(source, /setEditing\(true\)/);
  assert.match(source, /setEditing\(false\)/);
  assert.doesNotMatch(source, /grid gap-4 lg:grid-cols-2/);
});
