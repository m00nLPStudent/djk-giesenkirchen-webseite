import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const repository = readFileSync(new URL("./tableTennisPublic.repository.js", import.meta.url), "utf8");

test("public table-tennis repository is server-only and resolves the active department by stable slug", () => {
  assert.match(repository, /import "server-only"/);
  assert.match(repository, /from\("departments"\)[\s\S]*\.eq\("slug", TABLE_TENNIS_DEPARTMENT_SLUG\)\.eq\("is_active", true\)/);
  assert.doesNotMatch(repository, /service.role|SUPABASE_SERVICE_ROLE_KEY/i);
});

test("team list and detail queries bind active records to the resolved department and current season", () => {
  assert.match(repository, /from\("teams"\)[\s\S]*\.eq\("department_id", department\.id\)\.eq\("is_active", true\)/);
  assert.match(repository, /from\("team_seasons"\)[\s\S]*\.eq\("season_id", season\.id\)\.eq\("is_active", true\)/);
  assert.match(repository, /\.eq\("slug", normalizedSlug\)\.eq\("department_id", department\.id\)\.eq\("is_active", true\)/);
  assert.match(repository, /normalizePublicTableTennisTeamSlug\(slug\)/);
});

test("detail relations are batch-loaded without a board contact dependency", () => {
  for (const table of ["team_training_times", "player_team_seasons", "coach_team_seasons"]) assert.match(repository, new RegExp(`from\\("${table}"\\)`));
  const detailLoader = repository.slice(repository.indexOf("export async function loadPublicTableTennisTeamBySlug"));
  assert.doesNotMatch(detailLoader, /from\("board_members"\)/);
  assert.match(repository, /Promise\.all\(\[/);
  assert.doesNotMatch(repository, /football\.de|fussball_de|FuPa|fupa/i);
  assert.match(repository, /TABLE_TENNIS_COMPETITION_STATUS/);
});

test("standalone board and detail relations stay scoped while optional media stays presentation-only", () => {
  assert.match(repository, /\.eq\("organization_scope", "department"\)\.eq\("department_id", department\.data\.id\)\.eq\("is_active", true\)/);
  assert.match(repository, /loadPublicMediaUrlMap/);
  assert.match(repository, /publicMediaUrlsOrEmpty\(mediaResult\)/);
  assert.match(repository, /if \(queryError\) return closed/);
  assert.doesNotMatch(repository, /from\("teams"\)[\s\S]*?\.is\("department_id", null\)/);
});

test("season query uses the verified live column contract", () => {
  assert.match(repository, /select\("id, name, is_current, is_active, sort_order"\)/);
  assert.doesNotMatch(repository, /from\("seasons"\)\.select\([^)]*name_de/);
});

test("team list and detail resolve images through the same public media contract", () => {
  assert.match(repository, /loadPublicMediaUrlMap/);
  assert.equal((repository.match(/resolvePublicTableTennisTeamImage\(\{ team, teamSeason, mediaUrls \}\)/g) || []).length, 2);
  assert.match(repository, /publicMediaUrlsOrEmpty\(mediaResult\)/);
});

test("team summaries carry the already resolved detail image into the list DTO", () => {
  assert.match(repository, /mergePublicTableTennisSummaries\(teamsResult\.data, details\)/);
});
