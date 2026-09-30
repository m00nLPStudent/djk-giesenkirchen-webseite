import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const actions = await readFile(new URL("../../../app/admin/teams/actions.js", import.meta.url), "utf8");
const form = await readFile(new URL("./forms/AdminTeamsForm.js", import.meta.url), "utf8");
const page = await readFile(new URL("../../../app/admin/teams/edit/[id]/page.js", import.meta.url), "utf8");
const trainingActions = await readFile(new URL("../../../app/admin/teams/training/actions.js", import.meta.url), "utf8");
const editRepository = await readFile(new URL("./teamEditCoach.repository.js", import.meta.url), "utf8");

test("trainer actions validate permission, team scope and existing team-season identity", () => {
  assert.match(actions, /loadAuthorizedTeamMutationContext\("teams\.edit"\)/);
  assert.match(actions, /canAccessTeamOnServer\(authContext\.scopeContext, team\)/);
  assert.match(actions, /\.eq\("id", teamSeasonId\)\s*\.eq\("team_id", teamId\)/s);
});

test("authorized team mutation context preserves the resolved permissions", () => {
  const contextStart = actions.indexOf("async function loadAuthorizedTeamMutationContext");
  const contextEnd = actions.indexOf("async function hasPersonsWithoutDepartmentAssignment");
  const context = actions.slice(contextStart, contextEnd);

  assert.match(context, /assertAdminActionPermission\(\{\s*requiredPermission/s);
  assert.match(context, /permissions: permissionResult\.permissions \|\| \[\]/);
});

test("trainer field actions use update instead of team season upsert", () => {
  const targetedStart = actions.indexOf("async function saveTrainerTeamSeasonFields");
  const targetedEnd = actions.indexOf("export async function saveTrainerTeamRosterAction");
  const targeted = actions.slice(targetedStart, targetedEnd);
  assert.match(targeted, /\.from\("team_seasons"\)\s*\.update\(payload\)/s);
  assert.doesNotMatch(targeted, /\.upsert\(/);
});

test("full save and read-only server mutations reject restricted trainers", () => {
  assert.match(actions, /teamId && isRestrictedTrainerRoleSet\(authContext\.roles\)/);
  assert.match(actions, /Jahrgaenge sind fuer Trainer nur lesbar/);
  assert.match(actions, /Der Spielbetrieb ist fuer Trainer nur lesbar/);
  assert.match(actions, /Medien sind fuer Trainer nur lesbar/);
});

test("trainer UI keeps every tab visible but only exposes saves for allowed tabs", () => {
  assert.match(page, /restrictedTrainer=\{isRestrictedTrainerRoleSet\(permissionResult\.roles\)\}/);
  assert.match(form, /<TeamFormTabs activeTab=\{activeTab\}/);
  assert.match(form, /fieldset disabled=\{restrictedTrainer && !canRestrictedTrainerEditTab\(activeTab\)\}/);
  assert.match(form, /!restrictedTrainer \|\| canRestrictedTrainerEditTab\(activeTab\)/);
});

test("trainer tabs dispatch only targeted operations", () => {
  assert.match(form, /description: \(\) => saveTrainerTeamDescriptionAction/);
  assert.match(form, /training: \(\) => saveTrainerTeamTrainingSummaryAction/);
  assert.match(form, /players: \(\) => saveTrainerTeamRosterAction/);
  assert.match(form, /contact: \(\) => saveTrainerTeamContactAction/);
});

test("successful trainer saves keep the editor mounted and synchronize returned data", () => {
  assert.match(actions, /return \{ data: payload, error: null \}/);
  assert.match(actions, /data: \{ selected_player_ids: normalizedPlayerIds \}/);
  assert.match(form, /synchronizeTrainerTeamFormAfterSave/);
  assert.match(form, /if \(!restrictedTrainer\) \{\s*router\.push\(returnPath\)/s);
  assert.match(form, /router\.refresh\(\)/);
  for (const field of [
    "description_de",
    "training_times_de",
    "contact_name",
    "contact_email",
    "contact_phone",
  ]) {
    assert.match(editRepository, new RegExp(field));
  }
});

test("roster changes additionally require players.edit", () => {
  const rosterStart = actions.indexOf("export async function saveTrainerTeamRosterAction");
  const rosterEnd = actions.indexOf("export async function saveTeamSeasonYearGroupsAction");
  const roster = actions.slice(rosterStart, rosterEnd);

  assert.match(roster, /loadAuthorizedTeamMutationContext\("teams\.edit"\)/);
  assert.match(roster, /\(auth\.permissions \|\| \[\]\)\.includes\("players\.edit"\)/);
  assert.match(roster, /Fehlende Berechtigung: players\.edit/);
  assert.match(roster, /loadScopedExistingTeamSeason\(auth, teamId, teamSeasonId\)/);
  assert.match(roster, /validatePersonMasterDepartment\(writeDb, "players", normalizedPlayerIds, context\.team\.department_id\)/);
  assert.doesNotMatch(roster, /hasPersonsWithoutDepartmentAssignment/);
  assert.match(roster, /replacePlayerAssignments\(context\.teamSeason\.id, normalizedPlayerIds, writeDb\)/);

  assert.ok(roster.indexOf('includes("players.edit")') < roster.indexOf("loadScopedExistingTeamSeason"));
  assert.ok(roster.indexOf("loadScopedExistingTeamSeason") < roster.indexOf("createSupabaseAdminClient()"));
  assert.ok(roster.indexOf("createSupabaseAdminClient()") < roster.indexOf("replacePlayerAssignments"));
});

test("approved trainer writes switch to service role only after permission and scope checks", () => {
  const targeted = actions.slice(actions.indexOf("async function saveTrainerTeamSeasonFields"));
  assert.ok(targeted.indexOf('loadAuthorizedTeamMutationContext("teams.edit")') < targeted.indexOf("createSupabaseAdminClient()"));
  assert.ok(targeted.indexOf("loadScopedExistingTeamSeason") < targeted.indexOf("createSupabaseAdminClient()"));
  assert.ok(trainingActions.indexOf('assertAdminActionPermission({ requiredPermission: "teams.edit" })') < trainingActions.indexOf("createSupabaseAdminClient()"));
  assert.match(trainingActions, /canAccessTeamOnServer\(authState\.scope, context\.team\)/);
});
