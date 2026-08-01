import test from "node:test";
import assert from "node:assert/strict";
import {
  createCoachRoleSummary,
  getCoachAssignmentRoleLabels,
  getCoachLegacyRoleLabels,
} from "./coachRoleSummary.mjs";

test("getCoachAssignmentRoleLabels keeps all relational roles in stable order", () => {
  assert.deepEqual(
    getCoachAssignmentRoleLabels([
      { roleDe: "Trainer" },
      { role_de: "Betreuer" },
      { roleEn: "Coach" },
      { role_en: "Assistant Coach" },
      { roleDe: "Trainer" },
    ]),
    ["Trainer", "Betreuer", "Coach", "Assistant Coach"],
  );
});

test("createCoachRoleSummary prefers assignment roles and disables legacy fallback", () => {
  const summary = createCoachRoleSummary(
    [{ roleDe: "Trainer" }, { roleDe: "Torwarttrainer" }],
    {
      role_de: "Legacy Trainer",
      role: "Legacy",
      role_en: "Legacy Coach",
    },
  );

  assert.deepEqual(summary.roleLabels, ["Trainer", "Torwarttrainer"]);
  assert.equal(summary.primaryRoleLabel, "Trainer");
  assert.equal(summary.legacyRoleFallbackUsed, false);
  assert.deepEqual(summary.legacyRoleLabels, []);
});

test("createCoachRoleSummary uses master role fallback only when no assignments exist", () => {
  const summary = createCoachRoleSummary([], {
    role_de: "Betreuer",
    role: "Legacy",
    role_en: "Supervisor",
  });

  assert.deepEqual(summary.roleLabels, ["Betreuer"]);
  assert.equal(summary.primaryRoleLabel, "Betreuer");
  assert.equal(summary.legacyRoleFallbackUsed, true);
});

test("getCoachLegacyRoleLabels returns an empty list for roleless coaches", () => {
  assert.deepEqual(getCoachLegacyRoleLabels({}), []);
});
