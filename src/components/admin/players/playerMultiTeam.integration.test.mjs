import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(relativeUrl) {
  return readFileSync(new URL(relativeUrl, import.meta.url), "utf8");
}

const formSource = source("./forms/AdminPlayersForm.js");
const fieldsSource = source("./forms/fields/PlayerBasicFields.js");
const actionSource = source("../../../app/admin/players/actions.js");
const writeSource = source("./services/playerWrite.service.js");
const notificationSource = source(
  "../notifications/teamAssignmentNotifications.service.js",
);
const publicRepositorySource = source(
  "../../website/table-tennis/tableTennisPublic.repository.js",
);

test("table-tennis form exposes an unbounded deduplicated multi-team contract", () => {
  assert.match(formSource, /team_season_ids/);
  assert.match(fieldsSource, /Weitere Mannschaft hinzufügen/);
  assert.match(fieldsSource, /availableAdditionalTeams/);
  assert.match(fieldsSource, /type="button"/);
  assert.match(fieldsSource, /sportContext === "table_tennis"/);
});

test("server action resolves every table-tennis target and rejects cross-department targets", () => {
  assert.match(actionSource, /resolvePlayerTeamSeasonTargets/);
  assert.match(actionSource, /resolvedTargetOptions\.some/);
  assert.match(actionSource, /!== "tischtennis"/);
  assert.match(actionSource, /canCreatePlayerOnServer\(scopeContext, targetTeamIds/);
  assert.match(actionSource, /allowMultipleAssignments: isTableTennisMutation/);
});

test("multi-team write uses differential operations and the existing rollback contract", () => {
  assert.match(writeSource, /createMultiPlayerAssignmentSyncPlan/);
  assert.match(writeSource, /syncPlan\.deactivatedAssignments/);
  assert.match(writeSource, /syncPlan\.reactivatedAssignments/);
  assert.match(writeSource, /syncPlan\.addedTeamSeasonIds/);
  assert.match(writeSource, /createPlayerAssignmentRollbackPlan/);
  assert.match(writeSource, /restorePlayerMaster/);
  assert.doesNotMatch(writeSource, /player_team_seasons"\)\.delete/);
});

test("football retains its single-target assignment decision path", () => {
  assert.match(writeSource, /determinePlayerAssignmentOperation/);
  assert.match(actionSource, /resolvePlayerTeamSeasonTarget/);
  assert.match(actionSource, /isTableTennisMutation/);
});

test("multi-team notifications compare previous and next teams without inventing updates", () => {
  assert.match(notificationSource, /SYNC_MULTI_ASSIGNMENTS/);
  assert.match(notificationSource, /previousAssignments/);
  assert.match(notificationSource, /nextAssignments/);
  assert.match(notificationSource, /buildPlayerRemovedNotification/);
  assert.match(notificationSource, /buildPlayerAssignedNotification/);
});

test("public table-tennis rosters remain relation-based per team season", () => {
  assert.match(
    publicRepositorySource,
    /from\("player_team_seasons"\)[\s\S]*?eq\("team_season_id", teamSeason\.id\)[\s\S]*?eq\("is_active", true\)/,
  );
});
