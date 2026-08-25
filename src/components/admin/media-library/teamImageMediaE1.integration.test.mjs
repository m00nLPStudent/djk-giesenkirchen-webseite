import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, form, hook, tab, initial, service, assignment, adminListPage, adminList, adminDetail, editPage, publicRepository, publicDetail, mediaService] = await Promise.all([
  read("../../../app/admin/teams/actions.js"), read("../teams/forms/AdminTeamsForm.js"),
  read("../teams/forms/useTeamMedia.js"), read("../teams/forms/tabs/TeamMediaTab.js"),
  read("../teams/forms/helpers/teamFormInitialState.js"), read("../teams/services/teams.service.js"),
  read("./mediaAssignment.core.mjs"), read("../../../app/admin/teams/page.js"),
  read("../teams/AdminTeamsList.js"), read("../../../app/admin/teams/[id]/page.js"),
  read("../../../app/admin/teams/edit/[id]/page.js"), read("../../../lib/football/teams.js"),
  read("../../../app/(website)/fussball/[slug]/page.js"), read("./media.service.js"),
]);

test("team form uses the central picker and keeps contact media on the legacy path", () => {
  assert.match(tab, /AdminMediaPicker/);
  assert.match(tab, /usageContext="team"/);
  assert.match(tab, /resolveLoadedMediaImage/);
  assert.match(form, /useTeamMedia/);
  assert.doesNotMatch(form, /async function uploadImage/);
  assert.match(form, /uploadTeamImage[\s\S]*async function uploadContactImage/);
  assert.match(form, /uploadContactImage/);
  assert.match(form, /TeamContactTab/);
});

test("selection, replacement and explicit removal preserve legacy unless removal is saved", () => {
  assert.match(initial, /team_image_media_asset_id: team\?\.team_image_media_asset_id \|\| null/);
  assert.match(initial, /remove_legacy_team_image: false/);
  assert.match(hook, /team_image_media_asset_id: media\?\.id \|\| null/);
  assert.match(hook, /remove_legacy_team_image: !media/);
  assert.match(form, /team_image_media_asset_id: current\.team_image_media_asset_id/);
  assert.match(form, /remove_legacy_team_image: current\.remove_legacy_team_image/);
  assert.match(service, /team_image_url: team\.remove_legacy_team_image \? null : team\.team_image_url \|\| null/);
  assert.equal((service.match(/team_image_url:/g) || []).length, 2);
  assert.doesNotMatch(hook, /team_image_url:/);
});

test("create and edit validate scope and media before atomic team usage synchronization", () => {
  assert.match(actions, /requiredPermission = teamId \? "teams\.edit" : "teams\.create"/);
  assert.match(actions, /canAccessTeamOnServer/);
  assert.match(actions, /canCreateTeamInScope/);
  assert.match(actions, /resolveEntityImageMedia[\s\S]*saveTeamWithSeason[\s\S]*synchronizeMediaAssignment\("team", result\.teamId/);
  assert.match(assignment, /"club_contact", "team"/);
  assert.match(actions, /Die Mannschaftsbild-Verwendung konnte nicht gespeichert werden/);
});

test("team picker is server-authorized, cross-purpose and upload remains team-purpose public", () => {
  assert.match(actions, /authorizeTeamMedia/);
  assert.match(actions, /normalizePickerPurpose\(filters\.purpose, "team"\)/);
  assert.match(actions, /kind: "image"/);
  assert.match(actions, /archived: "active"/);
  assert.match(actions, /canManageMedia[\s\S]*\["public", "admin"\]/);
  assert.doesNotMatch(actions, /"restricted"/);
  assert.match(actions, /visibility: "public", purpose: "team"/);
  assert.match(mediaService, /purpose && result\.data\.purpose !== purpose/);
  assert.doesNotMatch(actions, /resolveEntityImageMedia\([^)]*purpose: "team"[^)]*teamPayload/);
});

test("admin overview and detail resolve central media server-side without N plus one", () => {
  assert.match(adminListPage, /loadMediaUrlMap\(\[[\s\S]*team\.team_image_media_asset_id/);
  assert.match(adminListPage, /resolved_team_image_url: resolveTeamImage/);
  assert.match(adminList, /TeamImage team=\{team\}/);
  assert.equal((adminList.match(/<TeamImage team=\{team\}/g) || []).length, 2);
  assert.doesNotMatch(adminList, /supabase|loadMediaUrlMap/);
  assert.match(adminDetail, /loadMediaUrlMap\(\[[\s\S]*team\.team_image_media_asset_id/);
  assert.match(adminDetail, /team_image_url: resolvedTeamImageUrl/);
  assert.match(editPage, /loadMediaAssetForPicker\(team\.team_image_media_asset_id\)/);
  assert.match(editPage, /initialTeamMedia=\{teamMedia\.data \|\| null\}/);
});

test("public list and detail use only public media and preserve season merge before fallback", () => {
  assert.match(publicRepository, /team_image_media_asset_id/);
  assert.match(publicRepository, /error\?\.code === "42703"[\s\S]*LEGACY_TEAM_FIELDS/);
  assert.match(publicRepository, /loadPublicMediaUrlMap/);
  assert.match(publicRepository, /resolvePublicTeamImage/);
  assert.match(publicDetail, /mergeTeamSeason\(team, teamSeason, selectedSeason\)[\s\S]*loadPublicMediaUrlMap/);
  assert.match(publicDetail, /resolvePublicTeamImage/);
  assert.doesNotMatch(publicRepository + publicDetail, /loadMediaUrlMap/);
});

test("team media keeps contact media legacy and uses only the planned seasonal media id", () => {
  const all = actions + form + hook + tab + initial + service;
  assert.doesNotMatch(all, /contact_image_media_asset_id/);
  assert.match(all, /season_team_image_media_asset_id/);
  assert.match(service, /contact_image_url/);
  assert.match(service, /createTeamSeasonPayload/);
});
