import test from "node:test";
import assert from "node:assert/strict";
import { isEligibleTeamEditPlayer } from "./teamEditPlayer.core.mjs";

const departments = new Map([["football-team", "football"], ["tt-team", "table-tennis"]]);

test("active teamless players from the target department are eligible", () => {
  assert.equal(isEligibleTeamEditPlayer(
    { id: "player", is_active: true, department_id: "football" },
    { departmentId: "football", teamId: "football-team", currentTeamIds: [], departmentByTeamId: departments },
  ), true);
});

test("inactive and cross-department players remain unavailable", () => {
  const context = { departmentId: "football", teamId: "football-team", currentTeamIds: [], departmentByTeamId: departments };
  assert.equal(isEligibleTeamEditPlayer({ is_active: false, department_id: "football" }, context), false);
  assert.equal(isEligibleTeamEditPlayer({ is_active: true, department_id: "table-tennis" }, context), false);
});

test("existing current relations retain the team and department boundary", () => {
  const player = { is_active: true, department_id: "football" };
  assert.equal(isEligibleTeamEditPlayer(player, { departmentId: "football", teamId: "football-team", currentTeamIds: ["football-team"], departmentByTeamId: departments }), true);
  assert.equal(isEligibleTeamEditPlayer(player, { departmentId: "football", teamId: "football-team", currentTeamIds: ["tt-team"], departmentByTeamId: departments }), false);
});
