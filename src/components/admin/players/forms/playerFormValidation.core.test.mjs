import test from "node:test";
import assert from "node:assert/strict";
import { validatePlayerRequiredFields } from "./playerFormValidation.core.mjs";

const validBase = {
  team_season_id: "team-season-1",
  first_name: "Tina",
  last_name: "Test",
  birthdate: "2010-01-01",
  nationality: "DE",
  gender: "female",
};

test("table-tennis validation accepts its complete sport-specific contract without a football position", () => {
  assert.deepEqual(validatePlayerRequiredFields({ ...validBase, strong_hand: "Rechts" }, "table_tennis"), {});
});

test("table-tennis validation requires strong hand but keeps team optional", () => {
  const errors = validatePlayerRequiredFields(validBase, "table_tennis");
  assert.deepEqual(Object.keys(errors), ["strong_hand"]);
  assert.equal("position_de" in errors, false);
  assert.equal("strong_foot" in errors, false);

  const withoutTeam = validatePlayerRequiredFields({ ...validBase, team_season_id: "", strong_hand: "Links" }, "table_tennis");
  assert.equal(withoutTeam.team_season_id, undefined);
});

test("football validation keeps team, position and shirt number optional", () => {
  const optionalFields = validatePlayerRequiredFields({ ...validBase, team_season_id: "", position_de: "", shirt_number: "" }, "football");
  assert.equal("team_season_id" in optionalFields, false);
  assert.equal("position_de" in optionalFields, false);
  assert.equal("shirt_number" in optionalFields, false);
  assert.equal("strong_hand" in optionalFields, false);
  assert.deepEqual(optionalFields, {});
});
