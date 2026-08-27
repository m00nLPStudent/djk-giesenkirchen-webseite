import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (name) => readFile(new URL(`../../../../docs/sql/${name}`, import.meta.url), "utf8");
const [preflight, proposal, rollback, postcheck] = await Promise.all([
  read("b15-23c-dashboard-profile-preflight-readonly.sql"),
  read("b15-23c-dashboard-profile-proposal.sql"),
  read("b15-23c-dashboard-profile-rollback.sql"),
  read("b15-23c-dashboard-profile-postcheck-readonly.sql"),
]);

test("preflight and postcheck are strictly read-only", () => {
  const mutation = /^\s*(?:INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE|DO|CALL|MERGE|COPY)\b/im;
  assert.doesNotMatch(preflight, mutation);
  assert.doesNotMatch(postcheck, mutation);
});

test("proposal adds only separate dashboard profile fields with bounded checks", () => {
  for (const column of ["nickname", "phone", "profile_image_media_asset_id"]) assert.match(proposal, new RegExp(`ADD COLUMN ${column}`));
  assert.match(proposal, /char_length\(nickname\) BETWEEN 1 AND 80/);
  assert.match(proposal, /char_length\(phone\) BETWEEN 1 AND 40/);
  assert.match(proposal, /REFERENCES public\.media_assets\(id\) ON DELETE SET NULL/);
  assert.doesNotMatch(proposal, /ALTER TABLE (?:auth\.users|public\.coaches|public\.board_members)/);
});

test("proposal extends purpose, path and usage without opening media-library reads", () => {
  assert.match(proposal, /media_assets_purpose_check[\s\S]*'profile'/);
  assert.match(proposal, /media_assets_storage_path_check[\s\S]*images\/profile\/\[0-9a-f-\]\+\\\.\(jpg\|png\|webp\)/);
  assert.doesNotMatch(proposal, /documents\/profile|images\/profile\/[\s\S]{0,80}pdf/);
  assert.match(proposal, /media_asset_usages_entity_type_check[\s\S]*'admin_profile'/);
  assert.doesNotMatch(proposal, /CREATE POLICY[\s\S]*ON public\.media_(?:assets|asset_usages)[\s\S]*TO authenticated/i);
  assert.match(rollback, /media_assets_storage_path_check[\s\S]*download\|system\)\//);
});

test("live constraint guards compare semantic values instead of formatted definitions", () => {
  assert.match(proposal, /conname='media_assets_purpose_check'/);
  assert.match(proposal, /conname='media_assets_storage_path_check'/);
  assert.match(proposal, /conname='media_asset_usages_entity_type_check'/);
  assert.match(proposal, /regexp_matches\(purpose_definition, '''\(\[\^''\]\+\)'''/);
  assert.match(proposal, /purpose_values IS DISTINCT FROM ARRAY\[[\s\S]*'player'[\s\S]*'system'[\s\S]*'team'/);
  assert.match(proposal, /entity_values IS DISTINCT FROM ARRAY\[[\s\S]*'admin_profile'/, "guard or target must mention the new entity");
  assert.match(proposal, /path_regex IS DISTINCT FROM '\^\(images\|documents\)\/\(player\|coach\|board\|team\|news\|cms\|club_history\|sponsor\|event\|document\|download\|system\)\//);
  assert.match(proposal, /RAISE EXCEPTION 'B15\.23C aborted: unexpected media storage-path constraint'/);
});

test("own update RPC derives identity from auth and cannot mutate official account fields", () => {
  const ownFunction = proposal.match(/CREATE FUNCTION public\.update_own_dashboard_profile[\s\S]*?\$fn\$;/)?.[0] || "";
  assert.match(ownFunction, /WHERE id=auth\.uid\(\) AND is_active=true/);
  assert.doesNotMatch(ownFunction, /p_user|user_id|full_name\s*=|email\s*=|role\s*=|permission|admin_profile_id\s*=/);
  assert.match(ownFunction, /SET nickname=safe_nickname,phone=safe_phone,updated_at=now\(\)/);
  assert.match(proposal, /DROP POLICY admin_profiles_update_own_authenticated/);
  assert.match(proposal, /GRANT EXECUTE ON FUNCTION public\.update_own_dashboard_profile\(text,text\) TO authenticated/);
  assert.match(proposal, /admin_profiles_update_superadmin/);
});

test("last-login RPC accepts no timestamp and derives the actor", () => {
  const touchFunction = proposal.match(/CREATE FUNCTION public\.touch_own_admin_profile_last_login\(\)[\s\S]*?\$fn\$;/)?.[0] || "";
  assert.match(touchFunction, /touched_at timestamptz:=now\(\)/);
  assert.match(touchFunction, /WHERE id=auth\.uid\(\) AND is_active=true/);
  assert.doesNotMatch(touchFunction, /p_user|p_timestamp|user_id/);
});

test("avatar assignment is private, profile-purpose and service-role only", () => {
  assert.match(proposal, /p_field_name='avatar' AND p_entity_type='admin_profile'/);
  assert.match(proposal, /storage_bucket<>'media-library-private'/);
  assert.match(proposal, /visibility<>'admin'/);
  assert.match(proposal, /purpose<>'profile'/);
  assert.match(proposal, /entity_type='admin_profile'.*field_name='avatar'/);
  assert.match(proposal, /REVOKE ALL ON FUNCTION public\.synchronize_media_assignment\(text,uuid,uuid,text\) FROM PUBLIC,anon,authenticated/);
  assert.match(proposal, /GRANT EXECUTE ON FUNCTION public\.synchronize_media_assignment\(text,uuid,uuid,text\) TO service_role/);
});

test("rollback is fail-closed for profile data and restores the prior own policy", () => {
  assert.match(rollback, /rollback aborted: profile data\/media exists/);
  assert.match(rollback, /CREATE POLICY admin_profiles_update_own_authenticated/);
  assert.match(rollback, /DROP COLUMN profile_image_media_asset_id[\s\S]*DROP COLUMN phone[\s\S]*DROP COLUMN nickname/);
});
