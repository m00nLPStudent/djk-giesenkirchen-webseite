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
});
