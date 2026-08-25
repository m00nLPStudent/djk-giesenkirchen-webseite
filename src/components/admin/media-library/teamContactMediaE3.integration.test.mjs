import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [actions, form, hook, tab, initial, service, edit, page, proposal, postcheck, rollback] = await Promise.all([
  read("../../../app/admin/teams/actions.js"), read("../teams/forms/AdminTeamsForm.js"), read("../teams/forms/useTeamMedia.js"),
  read("../teams/forms/tabs/TeamMediaTab.js"), read("../teams/forms/helpers/teamFormInitialState.js"), read("../teams/services/teams.service.js"),
  read("../../../app/admin/teams/edit/[id]/page.js"), read("../../../app/(website)/fussball/[slug]/page.js"),
  read("../../../../docs/sql/b15-19e3-team-contact-media-reference-proposal.sql"), read("../../../../docs/sql/b15-19e3-team-contact-media-reference-postcheck-readonly.sql"), read("../../../../docs/sql/b15-19e3-team-contact-media-reference-rollback.sql"),
]);

test("general and seasonal contact pickers are independent central media slots", () => {
  for (const marker of ["Allgemeines Kontaktbild", "Saisonales Kontaktbild", "COACH_PLACEHOLDER_IMAGE"]) assert.match(tab, new RegExp(marker));
  for (const marker of ["contact_image_media_asset_id", "season_contact_image_media_asset_id", "remove_legacy_contact_image", "remove_legacy_season_contact_image"]) assert.match(initial + hook + form, new RegExp(marker));
  assert.doesNotMatch(form, /uploadTeamImage|uploadContactImage/);
});

test("save authorizes both references and synchronizes dedicated contact usages", () => {
  assert.match(actions, /allowedVisibilities[\s\S]*contactMediaResult[\s\S]*seasonContactMediaResult/);
  assert.match(actions, /synchronizeMediaAssignment\("team", result\.teamId,[\s\S]*"contact_image"\)/);
  assert.match(actions, /synchronizeMediaAssignment\("team_season", result\.teamSeasonId,[\s\S]*"contact_image"\)/);
  assert.match(service, /remove_legacy_contact_image \? null/);
  assert.match(service, /remove_legacy_season_contact_image \? null/);
});

test("edit loads contact assets in batches and public detail resolves public-only hierarchy", () => {
  assert.match(edit, /loadMediaAssetForPicker\(team\.contact_image_media_asset_id\)/);
  assert.match(edit, /flatMap\(\(item\) => \[item\.team_image_media_asset_id, item\.contact_image_media_asset_id\]\)/);
  assert.match(page, /loadPublicMediaUrlMap\(\[teamSeason\?\.team_image_media_asset_id,[\s\S]*contact_image_media_asset_id/);
  assert.match(page, /resolveTeamContactImage/);
});

test("SQL adds only E3 references and controlled assignment combinations", () => {
  assert.match(proposal, /teams ADD COLUMN IF NOT EXISTS contact_image_media_asset_id/);
  assert.match(proposal, /team_seasons ADD COLUMN IF NOT EXISTS contact_image_media_asset_id/);
  assert.match(proposal, /p_field_name = 'contact_image'[\s\S]*'team','team_season'/);
  assert.match(proposal, /SECURITY DEFINER SET search_path = public, pg_temp/);
  assert.match(proposal, /REVOKE ALL[\s\S]*PUBLIC, anon, authenticated/);
  assert.doesNotMatch(proposal, /UPDATE public\.teams SET contact_image_url|INSERT INTO public\.media_assets|storage\./);
  assert.match(postcheck, /anon_must_be_false[\s\S]*authenticated_must_be_false[\s\S]*service_role_must_be_true/);
  assert.match(rollback, /field_name='contact_image'/);
  assert.doesNotMatch(rollback, /DROP TABLE|DELETE FROM public\.media_assets|storage\./);
});
