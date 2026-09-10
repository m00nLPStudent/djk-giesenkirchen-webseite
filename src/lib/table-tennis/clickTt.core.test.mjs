import assert from "node:assert/strict";
import test from "node:test";
import { buildClickTtUrl, normalizeClickTtConfig, parseClickTtSchedule, parseClickTtTable } from "./clickTt.core.mjs";

const config = { association: "WTTV", external_season_key: "26--27", external_group_id: "522365", league_slug: "2._Bezirksliga_2", external_team_id: "3105537", is_active: true };
const html = (value) => `<script type="application/json">${JSON.stringify(value)}</script>`;

test("validates config and constructs only allowlisted click-TT URLs", () => {
  assert.equal(normalizeClickTtConfig(config).error, null);
  assert.equal(buildClickTtUrl(config, "tabelle"), "https://www.mytischtennis.de/click-tt/WTTV/26--27/ligen/2._Bezirksliga_2/gruppe/522365/tabelle/gesamt");
  assert.equal(buildClickTtUrl({ ...config, league_slug: "https://evil.example" }), null);
  assert.equal(buildClickTtUrl({ ...config, association: "../evil" }), null);
});

test("normalizes table and marks own team by external ID", () => {
  const result = parseClickTtTable(html({ league_table: [
    { table_rank: 1, team_id: 3105537, team_name: "Heimteam", meetings_count: 4, meetings_won: 3, meetings_tie: 1, meetings_lost: 0, matches_relation: "30:10", sets_relation: "95:40", games_relation: "+55", points_won: 7, player_name: "must-not-leak" },
    { table_rank: 2, team_id: 99, team_name: "Gastteam" },
  ] }), config.external_team_id);
  assert.equal(result.error, null);
  assert.equal(result.data[0].isOwnTeam, true);
  assert.equal(result.data[1].isOwnTeam, false);
  assert.equal("player_name" in result.data[0], false);
});

test("normalizes and filters schedule strictly by configured team ID", () => {
  const result = parseClickTtSchedule(html({ meetings_excerpt: [
    { meeting_id: 1, date: "2026-09-12T18:30:00", team_home_id: 3105537, team_away_id: 42, team_home: "Heimteam", team_away: "Gastteam", state: "scheduled", player_profiles: ["private"] },
    { meeting_id: 2, date: "2026-09-13T10:00:00", team_home_id: 7, team_away_id: 8, team_home: "Fremd A", team_away: "Fremd B" },
  ] }), config.external_team_id);
  assert.equal(result.error, null);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].isHome, true);
  assert.equal("player_profiles" in result.data[0], false);
});

test("fails closed for missing provider structures and keeps teams isolated", () => {
  assert.equal(parseClickTtTable(html({ other: [] }), config.external_team_id).error.code, "CLICK_TT_TABLE_MISSING");
  assert.equal(parseClickTtSchedule(html({ other: [] }), config.external_team_id).error.code, "CLICK_TT_SCHEDULE_MISSING");
  const table = parseClickTtTable(html({ league_table: [{ team_id: "A", team_name: "A" }] }), "B");
  assert.equal(table.data[0].isOwnTeam, false);
});
