import test from "node:test";
import assert from "node:assert/strict";
import { getForwardTargets } from "./settingsInitialState.js";

test("getForwardTargets prefers seasonal coach role labels over master role snapshots", () => {
  const [target] = getForwardTargets("coach", [
    {
      id: "coach-1",
      first_name: "Mira",
      last_name: "Muster",
      email: "mira@example.test",
      role_de: "Legacy Trainer",
      roleLabels: ["Cheftrainer", "Torwarttrainer"],
      primaryTeamName: "U17",
    },
  ]);

  assert.equal(
    target.label,
    "Mira Muster - Cheftrainer, Torwarttrainer - U17",
  );
  assert.equal(target.displayName, "Mira Muster");
  assert.deepEqual(target.teamLabels, ["U17"]);
  assert.equal(target.roleLabel, "Cheftrainer, Torwarttrainer");
  assert.equal(target.targetType, "coach");
});

test("getForwardTargets preserves normalized coach DTO names and multiple teams", () => {
  const [target] = getForwardTargets("coach", [{ id: "coach-2", displayName: "Mina DTO", teamNames: ["E1", "E2"], roleLabels: ["Trainer", "Co-Trainer"], isActive: false }]);
  assert.equal(target.displayName, "Mina DTO");
  assert.deepEqual(target.teamLabels, ["E1", "E2"]);
  assert.equal(target.roleLabel, "Trainer, Co-Trainer");
  assert.equal(target.isActive, false);
});

test("getForwardTargets resolves board member names without inventing data", () => {
  const [target] = getForwardTargets("board", [], [{ id: "board-1", full_name: "Alex Vorstand", role_de: "Jugendleitung", email: "alex@example.test" }]);
  assert.equal(target.displayName, "Alex Vorstand");
  assert.equal(target.roleLabel, "Jugendleitung");
  assert.equal(target.email, "alex@example.test");
  assert.equal(target.targetType, "board");
});
