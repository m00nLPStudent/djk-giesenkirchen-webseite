import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const actions = read("../../../app/admin/department/board/actions.js");
const form = read("./forms/AdminBoardMemberForm.js");
const persistence = read("./services/boardResponsibilities.repository.js");
const publicRepository = read("../../website/board/boardResponsibilities.repository.js");
const publicList = read("../../website/board/BoardResponsibilitiesList.js");

test("server mutation requires board.edit and validates the exact managed department", () => {
  assert.match(actions, /requiredPermission: "board\.edit"/);
  assert.match(actions, /responsibilityTarget\.data\.department_id === scopeContext\.managedDepartmentId/);
  assert.match(actions, /canManageAllBoardMembers/);
  assert.match(actions, /normalizeBoardResponsibilities/);
});

test("persistence updates first, deletes empty configurations and resolves insert races by constraint", () => {
  assert.match(persistence, /if \(!responsibilities\.length\).*\.delete\(\)/s);
  assert.match(persistence, /\.update\(\{ responsibilities \}\)/);
  assert.match(persistence, /\.insert\(payload\)/);
  assert.match(persistence, /23505/);
});

test("dashboard uses accessible line inputs without exposing postgres array syntax", () => {
  assert.match(form, /Aufgaben \/ Zust/);
  assert.match(form, /type="button"/);
  assert.match(form, /aria-label=\{`Aufgabe \$\{index \+ 1\} entfernen`\}/);
  assert.match(form, /BOARD_RESPONSIBILITY_MAX_LENGTH/);
  assert.doesNotMatch(form, /\{\s*"Aufgabe 1"\s*,\s*"Aufgabe 2"\s*\}/);
});

test("public lookup uses the full scope key and empty tasks render no trigger", () => {
  assert.match(publicRepository, /findBoardResponsibilities/);
  assert.match(publicRepository, /organization_scope, department_id, role_id, responsibilities/);
  assert.match(publicList, /if \(!validResponsibilities\.length\) return null/);
  assert.match(publicList, /Aufgaben &amp; Zust&auml;ndigkeiten/);
  assert.doesNotMatch(publicList, /Keine Aufgaben/);
});

test("public cards open an accessible native dialog containing every task", () => {
  assert.match(publicList, /"use client"/);
  assert.match(publicList, /showModal\(\)/);
  assert.match(publicList, /<dialog/);
  assert.match(publicList, /aria-labelledby=\{titleId\}/);
  assert.match(publicList, /onCancel=/);
  assert.match(publicList, /onClose=\{\(\) => triggerRef\.current\?\.focus\(\)\}/);
  assert.match(publicList, /overflow-y-auto/);
  assert.match(publicList, /validResponsibilities\.map/);
  assert.doesNotMatch(publicList, /\.slice\(0, 5\)|remaining/);
});
