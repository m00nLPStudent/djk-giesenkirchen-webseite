import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBoardCardLabel,
  buildCoachCardLabel,
  createCardRow,
  normalizeEmailForCardMatching,
} from "./profileCardLinks.core.mjs";

test("buildCoachCardLabel prefers dto roles over master role snapshots", () => {
  const label = buildCoachCardLabel(
    {
      first_name: "Mira",
      last_name: "Muster",
      role_de: "Legacy Trainer",
    },
    {
      displayName: "Mira Muster",
      roleLabels: ["Cheftrainer", "Torwarttrainer"],
    },
  );

  assert.equal(label, "Mira Muster - Cheftrainer, Torwarttrainer");
});

test("createCardRow keeps common metadata for coach linking rows", () => {
  const row = createCardRow(
    {
      id: "coach-1",
      email: "coach@example.test",
      admin_profile_id: "profile-1",
      is_active: true,
    },
    "coach",
    {
      coachDto: {
        displayName: "Coach One",
        roleLabels: ["Trainer"],
      },
    },
  );

  assert.equal(row.id, "coach-1");
  assert.equal(row.label, "Coach One - Trainer");
});

test("buildBoardCardLabel keeps board labels unchanged", () => {
  assert.equal(
    buildBoardCardLabel({
      first_name: "Eva",
      last_name: "Vorstand",
      role_de: "Jugendleiter",
    }),
    "Eva Vorstand - Jugendleiter",
  );
});

test("board linking DTO preserves the explicit organization contract", () => {
  const row = createCardRow({ id: "board-1", organization_scope: "club", department_id: null }, "board");
  assert.equal(row.organizationScope, "club");
  assert.equal(row.departmentId, null);
});

test("normalizeEmailForCardMatching lowercases and strips spaces", () => {
  assert.equal(
    normalizeEmailForCardMatching(" Mira.Muster @Example.TEST "),
    "mira.muster@example.test",
  );
});
