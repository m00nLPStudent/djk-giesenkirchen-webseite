import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("person create writes are server-only, route-fixed and team-optional", async () => {
  const [players, coaches, playerService, playerCore, coachCore, validation] = await Promise.all([
    read("../../../app/admin/players/actions.js"), read("../../../app/admin/coaches/actions.js"),
    read("../players/services/playerWrite.service.js"), read("../players/services/playerSeasonalWriteCore.mjs"),
    read("../coaches/services/coachSeasonalWriteCore.mjs"), read("../players/forms/playerFormValidation.core.mjs"),
  ]);
  for (const source of [players, coaches]) {
    assert.match(source, /assertAdminActionPermission/);
    assert.match(source, /const writeClient = createSupabaseAdminClient\(\)/);
    assert.match(source, /routeDepartment\?\.id/);
  }
  assert.match(playerService, /if \(!targetTeamSeasonOption\)[\s\S]*assignmentChange: null/);
  assert.doesNotMatch(validation, /team_season_id:/);
  assert.match(playerCore, /department_id: player\?\.department_id \|\| null/);
  assert.match(coachCore, /department_id: coach\?\.department_id \|\| null/);
  assert.doesNotMatch(coaches, /Mindestens eine Mannschaftszuordnung ist erforderlich/);
});

test("detail, counts and public football loaders use the department master", async () => {
  const [detail, teams, contributions, coachPublic, footballCoaches, footballTeam] = await Promise.all([
    read("../players/components/PlayerContributionDetailView.js"), read("../../../app/admin/teams/page.js"),
    read("../contributions/repositories/contributionStatus.repository.js"), read("../../website/coach/coachPublic.repository.js"),
    read("../../../app/(website)/fussball/abteilung/trainer/page.js"), read("../../../app/(website)/fussball/[slug]/page.js"),
  ]);
  assert.match(detail, /sportContext === "table_tennis"[\s\S]*Starke Hand/);
  assert.match(await read("../../../app/admin/players/[id]/page.js"), /strong_foot, strong_hand/);
  assert.match(teams, /relatedDepartmentId\(player\.players\) === team\.department_id/);
  assert.match(teams, /relatedDepartmentId\(coach\.coaches\) === team\.department_id/);
  assert.match(contributions, /playerDepartmentId === teamDepartmentBySeasonId/);
  assert.match(coachPublic, /query = query\.eq\("department_id", departmentId\)/);
  assert.match(footballCoaches, /slug", "fussball"/);
  assert.match(footballTeam, /player\.department_id === team\.department_id/);
});

test("player edits support a missing or removed team and retain sport master fields", async () => {
  const [action, service, core, validation, detailPage, notifications] = await Promise.all([
    read("../../../app/admin/players/actions.js"),
    read("../players/services/playerWrite.service.js"),
    read("../players/services/playerSeasonalWriteCore.mjs"),
    read("../players/forms/playerFormValidation.core.mjs"),
    read("../../../app/admin/players/[id]/page.js"),
    read("../notifications/teamAssignmentNotifications.service.js"),
  ]);
  assert.match(action, /activeSeasonId[\s\S]*loadCurrentSeasonResolution/);
  assert.match(service, /PLAYER_ASSIGNMENT_OPERATIONS\.DEACTIVATE/);
  assert.match(service, /targetTeamSeasonOption\?\.seasonId \|\| activeSeasonId/);
  assert.match(core, /strong_hand: toNullableString\(player\?\.strong_hand\)/);
  assert.doesNotMatch(validation, /position_de:/);
  assert.match(detailPage, /strong_foot, strong_hand/);
  assert.match(notifications, /else if \(target\) events\.push\(buildPlayerUpdatedNotification/);
});
