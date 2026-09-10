import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("K2 dashboard config remains server authorized and service-role backed", () => {
  const actions = read("../../../app/admin/teams/actions.js");
  const page = read("../../../app/admin/teams/edit/[id]/page.js");
  const tab = read("forms/tabs/TeamCompetitionTab.js");
  assert.match(actions, /loadAuthorizedTeamMutationContext\("teams\.edit"\)/);
  assert.match(actions, /canAccessTeamOnServer/);
  assert.match(actions, /department\.slug !== "tischtennis"/);
  assert.match(actions, /\.eq\("id", teamSeasonId\)\.eq\("team_id", team\.id\)/);
  assert.match(actions, /createSupabaseAdminClient/);
  assert.match(page, /loadCompetitionConfigs\(competitionDb, ids\)/);
  assert.match(tab, /type="button"/);
  assert.match(tab, /click-TT \/ myTischtennis/);
});
