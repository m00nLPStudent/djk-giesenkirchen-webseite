import assert from "node:assert/strict";
import test from "node:test";
import {
  getBoardOrganizationLabel,
  resolveBoardOrganizationTarget,
  validateBoardOrganizationPair,
} from "./boardOrganizationScope.core.mjs";

test("accepts all three valid board organization pairs", () => {
  assert.equal(validateBoardOrganizationPair({ organizationScope: "club", departmentId: null }).ok, true);
  assert.equal(validateBoardOrganizationPair({ organizationScope: "department", departmentId: "department-1" }).ok, true);
  assert.equal(validateBoardOrganizationPair({ organizationScope: "unassigned", departmentId: null }).ok, true);
});

test("rejects inconsistent board organization pairs", () => {
  assert.equal(validateBoardOrganizationPair({ organizationScope: "department", departmentId: null }).ok, false);
  assert.equal(validateBoardOrganizationPair({ organizationScope: "club", departmentId: "department-1" }).ok, false);
  assert.equal(validateBoardOrganizationPair({ organizationScope: "unassigned", departmentId: "department-1" }).ok, false);
});

test("department manager is fixed to the managed department", () => {
  assert.deepEqual(resolveBoardOrganizationTarget({ requestedScope: "department", requestedDepartmentId: "department-1", managedDepartmentId: "department-1" }), {
    ok: true,
    data: { organization_scope: "department", department_id: "department-1" },
  });
  assert.equal(resolveBoardOrganizationTarget({ requestedScope: "department", requestedDepartmentId: "department-2", managedDepartmentId: "department-1" }).ok, false);
  assert.equal(resolveBoardOrganizationTarget({ requestedScope: "club", managedDepartmentId: "department-1" }).ok, false);
  assert.equal(resolveBoardOrganizationTarget({ requestedScope: "unassigned", managedDepartmentId: "department-1" }).ok, false);
});

test("global scope accepts club, department and unassigned", () => {
  for (const target of [
    { requestedScope: "club", requestedDepartmentId: null },
    { requestedScope: "department", requestedDepartmentId: "department-1" },
    { requestedScope: "unassigned", requestedDepartmentId: null },
  ]) assert.equal(resolveBoardOrganizationTarget({ ...target, isGlobal: true }).ok, true);
});

test("fixed club route accepts only the club pair for a global board manager", () => {
  assert.deepEqual(resolveBoardOrganizationTarget({
    requestedScope: "club",
    routeOrganizationScope: "club",
    isGlobal: true,
  }), {
    ok: true,
    data: { organization_scope: "club", department_id: null },
  });
  assert.equal(resolveBoardOrganizationTarget({
    requestedScope: "department",
    requestedDepartmentId: "department-1",
    routeOrganizationScope: "club",
    isGlobal: true,
  }).ok, false);
  assert.equal(resolveBoardOrganizationTarget({
    requestedScope: "club",
    routeOrganizationScope: "club",
    isGlobal: false,
  }).ok, false);
});

test("limited own-card edit preserves the existing structure pair", () => {
  const existingMember = { organization_scope: "club", department_id: null };
  assert.equal(resolveBoardOrganizationTarget({ existingMember, requestedScope: "club" }).ok, true);
  assert.equal(resolveBoardOrganizationTarget({ existingMember, requestedScope: "unassigned" }).ok, false);
});

test("organization labels distinguish club and unassigned despite both having no department", () => {
  assert.equal(getBoardOrganizationLabel({ organization_scope: "club" }), "Gesamtverein");
  assert.equal(getBoardOrganizationLabel({ organization_scope: "unassigned" }), "Nicht zugeordnet");
  assert.equal(getBoardOrganizationLabel({ organization_scope: "department" }, "Tischtennis"), "Tischtennis");
});
