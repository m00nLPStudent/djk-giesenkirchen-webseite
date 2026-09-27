import test from "node:test";
import assert from "node:assert/strict";
import { canAccessEditorialRecord, isAllowedEditorialCategory, resolveEditorialDepartmentScope, scopeEditorialWritePayload } from "./editorialDepartmentScope.core.mjs";

test("superadmin retains global editorial access", () => {
  const scope = resolveEditorialDepartmentScope({ isGlobal: true, roleKeys: ["superadmin"] });
  assert.equal(scope.mode, "global");
  assert.equal(canAccessEditorialRecord(scope, { department_id: "football" }), true);
});

test("table-tennis board is restricted to its resolved department", () => {
  const scope = resolveEditorialDepartmentScope({ roleKeys: ["tischtennis-vorstand"], managedDepartmentId: "tt", managedDepartmentSlug: "tischtennis" });
  assert.deepEqual(scope, { mode: "department", departmentId: "tt", departmentSlug: "tischtennis", valid: true });
  assert.equal(canAccessEditorialRecord(scope, { department_id: "tt" }), true);
  assert.equal(canAccessEditorialRecord(scope, { department_id: "football" }), false);
  assert.equal(canAccessEditorialRecord(scope, { department_id: null }), false);
  assert.equal(isAllowedEditorialCategory(scope, "tischtennis"), true);
  assert.equal(isAllowedEditorialCategory(scope, "fussball"), false);
  assert.equal(scopeEditorialWritePayload(scope, { department_id: "football", title_de: "Test" }).department_id, "tt");
});

test("department-manager scope fails closed when department resolution is missing", () => {
  const scope = resolveEditorialDepartmentScope({ roleKeys: ["tischtennis-vorstand"] });
  assert.equal(scope.valid, false);
  assert.equal(canAccessEditorialRecord(scope, { department_id: null }), false);
});

test("roles without a department-manager contract retain their existing global contract", () => {
  const scope = resolveEditorialDepartmentScope({ roleKeys: ["webmaster"] });
  assert.equal(scope.mode, "global");
  assert.equal(scope.valid, true);
});
