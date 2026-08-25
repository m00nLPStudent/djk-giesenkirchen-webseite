import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, form, initial, tab, hook, service, mediaService, assignment, publicList, publicDetail, adminList, adminDetail, edit, placeholder] = await Promise.all([
  read("../../../app/admin/teams/actions.js"), read("../teams/forms/AdminTeamsForm.js"),
  read("../teams/forms/helpers/teamFormInitialState.js"), read("../teams/forms/tabs/TeamMediaTab.js"),
  read("../teams/forms/useTeamMedia.js"), read("../teams/services/teams.service.js"),
  read("./media.service.js"), read("./mediaAssignment.core.mjs"), read("../../../lib/football/teams.js"),
  read("../../../app/(website)/fussball/[slug]/page.js"), read("../../../app/admin/teams/page.js"),
  read("../../../app/admin/teams/[id]/page.js"), read("../../../app/admin/teams/edit/[id]/page.js"),
  read("../../website/team/TeamImagePlaceholder.js"),
]);

test("season and general team media remain distinct in form and persistence", () => {
  assert.match(initial, /season_team_image_media_asset_id: selectedTeamSeason\?\.team_image_media_asset_id/);
  assert.match(initial, /team_image_media_asset_id: team\?\.team_image_media_asset_id/);
  assert.match(tab, /Saisonales Mannschaftsbild[\s\S]*Allgemeines Mannschaftsbild/);
  assert.match(hook, /handleSeasonMediaChange[\s\S]*season_team_image_media_asset_id/);
  assert.match(service, /remove_legacy_season_team_image \? null : team\.season_team_image_url/);
});

test("save validates and synchronizes independent team and team season usages", () => {
  assert.match(actions, /resolveEntityImageMedia\(teamPayload\?\.season_team_image_media_asset_id/);
  assert.match(actions, /synchronizeMediaAssignment\("team_season", result\.teamSeasonId/);
  assert.match(assignment, /"team_season"/);
  assert.match(actions, /allowedVisibilities = canManageMedia[\s\S]*\["public", "admin"\][\s\S]*\["public"\]/);
});

test("season direct upload reuses central team upload and size validation", () => {
  assert.match(tab, /AdminMediaPicker/);
  assert.match(tab, /usageContext="team"/);
  assert.match(form, /uploadMediaAction=\{teamMedia\.uploadMediaAction\}/);
  assert.match(actions, /visibility: "public", purpose: "team"/);
});

test("public and admin lists batch both image ids and share hierarchy", () => {
  assert.match(publicList, /flatMap[\s\S]*team_image_media_asset_id/);
  assert.equal((publicList.match(/loadPublicMediaUrlMap\(/g) || []).length, 1);
  assert.match(publicDetail, /teamSeason\?\.team_image_media_asset_id[\s\S]*team\?\.team_image_media_asset_id/);
  assert.match(adminList, /loadMediaUrlMap\(\[[\s\S]*teamSeason\.team_image_media_asset_id/);
  assert.match(adminDetail, /currentTeamSeason\?\.team_image_media_asset_id[\s\S]*team\.team_image_media_asset_id/);
});

test("edit loads seasonal picker assets in one batch and neutral placeholder is shared", () => {
  assert.match(edit, /loadMediaAssetsForPicker/);
  assert.equal((edit.match(/loadMediaAssetsForPicker\(/g) || []).length, 1);
  assert.match(mediaService, /export async function loadMediaAssetsForPicker/);
  assert.match(placeholder, /TEAM_PLACEHOLDER_ASSET_PATH/);
});
