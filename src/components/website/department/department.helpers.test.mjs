import test from "node:test";
import assert from "node:assert/strict";
import {
  getCoachTeamName,
  getDepartmentPersonDisplayName,
  mapBoardMemberForDisplay,
} from "./department.helpers.js";

test("getDepartmentPersonDisplayName prefers dto displayName and camelCase names", () => {
  assert.equal(
    getDepartmentPersonDisplayName({
      displayName: "Max Mustermann",
      firstName: "Kontakt",
      lastName: "Person",
      name: "Kontaktperson",
    }),
    "Max Mustermann",
  );

  assert.equal(
    getDepartmentPersonDisplayName({
      firstName: "Max",
      lastName: "Mustermann",
    }),
    "Max Mustermann",
  );
});

test("getDepartmentPersonDisplayName falls back neutrally when no person name exists", () => {
  assert.equal(
    getDepartmentPersonDisplayName({
      role_de: "Kontaktperson",
    }),
    "Name nicht hinterlegt",
  );
});

test("getCoachTeamName prefers seasonal coach dto fields", () => {
  assert.equal(
    getCoachTeamName({
      primaryTeamName: "U19",
      teamNames: ["U19", "U17"],
      team_name: "Legacy Team",
    }),
    "U19 +1 weitere",
  );

  assert.equal(
    getCoachTeamName({
      primaryTeamName: "U17",
      team_name: "Legacy Team",
    }),
    "U17",
  );
});

test("getCoachTeamName no longer uses coach.team_name as primary website source", () => {
  assert.equal(
    getCoachTeamName({
      team_name: "Legacy Team",
    }),
    "Keine Mannschaft zugeordnet",
  );
});

test("mapBoardMemberForDisplay keeps board role joins intact", () => {
  const member = mapBoardMemberForDisplay({
    role_de: "Vorstand",
    role_en: "Board",
    board_roles: {
      name_de: "Jugendleiter",
      name_en: "Head of Youth",
    },
  });

  assert.equal(member.role_de, "Jugendleiter");
  assert.equal(member.role_en, "Head of Youth");
});
