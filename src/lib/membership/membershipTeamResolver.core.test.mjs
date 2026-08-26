import test from "node:test";
import assert from "node:assert/strict";
import { buildMembershipTeamResolution, MEMBERSHIP_TEAM_RESOLUTION as S, parseMembershipBirthYear } from "./membershipTeamResolver.core.mjs";

const department = { id: "football", slug: "fussball", is_active: true };
const season = [{ id: "current", is_current: true }];
const mappings = [{ team_season_id: "ts1", birth_year: 2019 }, { team_season_id: "ts2", birth_year: 2019 }, { team_season_id: "historical", birth_year: 2019 }, { team_season_id: "inactive", birth_year: 2019 }, { team_season_id: "other", birth_year: 2019 }];
const teamSeasons = [{ id: "ts1", team_id: "t1", season_id: "current", name_de: "Team 1", age_group: "Jugend", is_active: true }, { id: "ts2", team_id: "t2", season_id: "current", name_de: "Team 2", is_active: true }, { id: "historical", team_id: "t3", season_id: "old", name_de: "Alt", is_active: true }, { id: "inactive", team_id: "t4", season_id: "current", name_de: "Inaktiv", is_active: false }, { id: "other", team_id: "t5", season_id: "current", name_de: "Fremd", is_active: true }];
const teams = [{ id: "t1", name_de: "Master 1", department_id: "football", is_active: true }, { id: "t2", name_de: "Master 2", department_id: "football", is_active: true }, { id: "t3", department_id: "football", is_active: true }, { id: "t4", department_id: "football", is_active: true }, { id: "t5", department_id: "other", is_active: true }];
const resolve = (overrides = {}) => buildMembershipTeamResolution({ birthdate: "2019-02-02", currentSeasons: season, footballDepartment: department, mappings, teamSeasons, teams, ...overrides });

test("strict YYYY-MM-DD parsing returns the birth year without timezone conversion", () => {
  assert.equal(parseMembershipBirthYear("2019-02-02"), 2019);
  for (const value of ["", null, "02.02.2019", "2019-02-31"]) assert.equal(parseMembershipBirthYear(value), null);
});

test("missing and invalid dates return a controlled state", () => {
  for (const birthdate of ["", "2019-13-01"]) assert.equal(resolve({ birthdate }).status, S.INVALID_BIRTHDATE);
});

test("missing and ambiguous current seasons are explicit", () => {
  assert.equal(resolve({ currentSeasons: [] }).status, S.CURRENT_SEASON_MISSING);
  assert.equal(resolve({ currentSeasons: [{ id: "a" }, { id: "b" }] }).status, S.CURRENT_SEASON_AMBIGUOUS);
});

test("none, single and multiple are distinguished and all matches are returned", () => {
  assert.equal(resolve({ mappings: [] }).status, S.NONE);
  const single = resolve({ mappings: [mappings[0]] });
  assert.equal(single.status, S.SINGLE);
  assert.deepEqual(single.options, [{ teamSeasonId: "ts1", name: "Team 1", ageGroup: "Jugend" }]);
  const multiple = resolve();
  assert.equal(multiple.status, S.MULTIPLE);
  assert.deepEqual(multiple.options.map((item) => item.teamSeasonId), ["ts1", "ts2"]);
});

test("historical, inactive and non-football mappings are excluded", () => {
  assert.equal(resolve({ mappings: mappings.slice(2) }).status, S.NONE);
  assert.equal(resolve({ teams: [{ ...teams[0], department_id: null }], mappings: [mappings[0]], teamSeasons: [teamSeasons[0]] }).status, S.NONE);
  assert.equal(resolve({ footballDepartment: null }).status, S.FOOTBALL_DEPARTMENT_MISSING);
});
