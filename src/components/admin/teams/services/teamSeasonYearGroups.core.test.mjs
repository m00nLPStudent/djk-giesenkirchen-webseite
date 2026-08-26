import test from "node:test";
import assert from "node:assert/strict";
import { normalizeBirthYears, resolveEligibleTeamSeasons, TEAM_SEASON_YEAR_GROUP_STATUSES as S } from "./teamSeasonYearGroups.core.mjs";

test("normalizes years and rejects implausible values", () => {
  assert.deepEqual(normalizeBirthYears([2017, "2016", 2017], { currentYear: 2026 }).data, [2016, 2017]);
  assert.equal(normalizeBirthYears([2027], { currentYear: 2026 }).error.code, "INVALID_BIRTH_YEAR");
});

test("returns all active matches in the current season without prioritization", () => {
  const result = resolveEligibleTeamSeasons({ birthYear: 2017, seasonResolution: { activeSeasonId: "s1", activeSeasonStatus: "CURRENT_SEASON_RESOLVED" }, mappings: [{ team_season_id: "ts1", birth_year: 2017 }, { team_season_id: "ts2", birth_year: 2017 }, { team_season_id: "ts3", birth_year: 2017 }], teamSeasons: [{ id: "ts1", team_id: "t1", season_id: "s1", is_active: true, name_de: "E1" }, { id: "ts2", team_id: "t2", season_id: "s1", is_active: true, name_de: "E2" }, { id: "ts3", team_id: "t3", season_id: "s2", is_active: true, name_de: "E3" }], teams: [{ id: "t1", is_active: true }, { id: "t2", is_active: true }, { id: "t3", is_active: true }] });
  assert.equal(result.status, S.RESOLVED);
  assert.deepEqual(result.options.map((item) => item.name), ["E1", "E2"]);
});

test("distinguishes missing, ambiguous, unmapped and inactive no-match states", () => {
  assert.equal(resolveEligibleTeamSeasons({ seasonResolution: { activeSeasonStatus: "CURRENT_SEASON_MISSING" } }).status, S.CURRENT_SEASON_MISSING);
  assert.equal(resolveEligibleTeamSeasons({ seasonResolution: { activeSeasonStatus: "CURRENT_SEASON_AMBIGUOUS" } }).status, S.CURRENT_SEASON_AMBIGUOUS);
  const base = { birthYear: 2017, seasonResolution: { activeSeasonId: "s1", activeSeasonStatus: "CURRENT_SEASON_RESOLVED" } };
  assert.equal(resolveEligibleTeamSeasons(base).status, S.UNMAPPED);
  assert.equal(resolveEligibleTeamSeasons({ ...base, mappings: [{ team_season_id: "ts1", birth_year: 2017 }], teamSeasons: [{ id: "ts1", team_id: "t1", season_id: "s1", is_active: false }], teams: [{ id: "t1", is_active: true }] }).status, S.NO_MATCH);
});
