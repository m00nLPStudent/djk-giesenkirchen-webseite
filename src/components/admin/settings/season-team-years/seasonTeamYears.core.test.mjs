import test from "node:test";
import assert from "node:assert/strict";
import { buildSeasonTeamYearsView } from "./seasonTeamYears.core.mjs";

const seasons = [{ id: "old", name: "2025/26", is_current: false }, { id: "current", name: "2026/27", is_current: true }];
const teamSeasons = [{ id: "ts-old", season_id: "old", team_id: "t1" }, { id: "ts-1", season_id: "current", team_id: "t1" }, { id: "ts-2", season_id: "current", team_id: "t2" }];
const mappings = [{ team_season_id: "ts-1", birth_year: 2017 }, { team_season_id: "ts-1", birth_year: 2016 }, { team_season_id: "ts-1", birth_year: 2017 }];

test("current season is selected and existing years are normalized", () => {
  const view = buildSeasonTeamYearsView({ seasons, teamSeasons, mappings });
  assert.equal(view.selectedSeasonId, "current");
  assert.deepEqual(view.rows.map((row) => row.id), ["ts-1", "ts-2"]);
  assert.deepEqual(view.rows[0].birthYears, [2016, 2017]);
  assert.deepEqual(view.rows[1].birthYears, []);
});

test("explicit season switch returns only that season", () => {
  const view = buildSeasonTeamYearsView({ seasons, teamSeasons, mappings, requestedSeasonId: "old" });
  assert.equal(view.selectedSeasonId, "old");
  assert.deepEqual(view.rows.map((row) => row.id), ["ts-old"]);
});

test("empty seasons and a season without teams remain valid empty states", () => {
  assert.deepEqual(buildSeasonTeamYearsView({}).rows, []);
  assert.deepEqual(buildSeasonTeamYearsView({ seasons: [{ id: "empty", is_current: true }] }).rows, []);
});

test("an empty mapping set represents removal of every assigned year", () => {
  const view = buildSeasonTeamYearsView({ seasons, teamSeasons, mappings: [] });
  assert.deepEqual(view.rows[0].birthYears, []);
});
