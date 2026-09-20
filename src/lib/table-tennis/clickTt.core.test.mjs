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
  assert.equal(result.data[0].status, "Geplant");
  assert.equal("player_profiles" in result.data[0], false);
});

test("converts provider UTC timestamps to official Europe/Berlin times and sorts meetings", () => {
  const result = parseClickTtSchedule(html({ meetings: [
    { meeting_id: 3, date: "2026-10-04T08:30:00.000+00:00", team_home_id: 3105537, team_away_id: 30, team_home: "DJK VfL Giesenkirchen", team_away: "TV Boisheim", state: "scheduled" },
    { meeting_id: 2, date: "2026-09-11T17:30:00.000+00:00", team_home_id: 20, team_away_id: 3105537, team_home: "DJK VfL Willich III", team_away: "DJK VfL Giesenkirchen", state: "done", is_meeting_complete: true, matches_won: "6", matches_lost: "4", hall_number: "2" },
    { meeting_id: 1, date: "2026-09-06T08:30:00.000+00:00", team_home_id: 3105537, team_away_id: 10, team_home: "DJK VfL Giesenkirchen", team_away: "TTC Waldniel IV", state: "done", is_meeting_complete: true, matches_won: "4", matches_lost: "6", hall_number: "1" },
  ] }), config.external_team_id);

  assert.deepEqual(result.data.map((meeting) => [meeting.date, meeting.time]), [
    ["2026-09-06", "10:30"],
    ["2026-09-11", "19:30"],
    ["2026-10-04", "10:30"],
  ]);
  assert.deepEqual(result.data.map((meeting) => meeting.result), ["4:6", "6:4", ""]);
  assert.deepEqual(result.data.map((meeting) => [meeting.isHome, meeting.isAway]), [[true, false], [false, true], [true, false]]);
  assert.deepEqual(result.data.map((meeting) => meeting.venue), ["Halle 1", "Halle 2", ""]);
  assert.equal(result.data[0].status, "");
  assert.equal(result.data[2].status, "Geplant");
});

test("uses timezone rules instead of a hardcoded summer offset", () => {
  const result = parseClickTtSchedule(html({ meetings: [
    { meeting_id: "summer", date: "2026-10-18T08:30:00.000+00:00", team_home_id: 3105537, team_away_id: 1, team_home: "A", team_away: "B" },
    { meeting_id: "winter", date: "2026-11-07T17:30:00.000+00:00", team_home_id: 1, team_away_id: 3105537, team_home: "B", team_away: "A" },
  ] }), config.external_team_id);

  assert.deepEqual(result.data.map((meeting) => meeting.time), ["10:30", "18:30"]);
});

test("deduplicates meetings and never exposes unknown provider states", () => {
  const meeting = { meeting_id: 1, date: "2026-12-01T18:00:00.000+00:00", team_home_id: 3105537, team_away_id: 2, team_home: "A", team_away: "B", state: "provider_internal_state" };
  const result = parseClickTtSchedule(html({ meetings_excerpt: [meeting, meeting] }), config.external_team_id);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].status, "");
  assert.equal(result.data[0].result, "");
});

test("missing optional schedule fields stay safe", () => {
  const result = parseClickTtSchedule(html({ meetings: [
    { meeting_id: 1, team_home_id: 3105537, team_away_id: 2 },
  ] }), config.external_team_id);
  assert.equal(result.error, null);
  assert.deepEqual(result.data[0], {
    meetingId: "1", date: "", time: "", homeTeam: "", awayTeam: "",
    result: "", status: "", venue: "", isHome: true, isAway: false,
  });
});

test("fails closed for missing provider structures and keeps teams isolated", () => {
  assert.equal(parseClickTtTable(html({ other: [] }), config.external_team_id).error.code, "CLICK_TT_TABLE_MISSING");
  assert.equal(parseClickTtSchedule(html({ other: [] }), config.external_team_id).error.code, "CLICK_TT_SCHEDULE_MISSING");
  const table = parseClickTtTable(html({ league_table: [{ team_id: "A", team_name: "A" }] }), "B");
  assert.equal(table.data[0].isOwnTeam, false);
});
