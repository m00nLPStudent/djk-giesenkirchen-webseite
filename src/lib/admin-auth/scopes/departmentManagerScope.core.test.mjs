import assert from "node:assert/strict";
import test from "node:test";
import { hasManagedDepartmentRouteMismatch, resolveManagedDepartmentRole } from "./departmentManagerScope.core.mjs";

test("football board role resolves only the football department", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["fussball-vorstand"]), {
    departmentSlug: "fussball",
    conflict: false,
  });
});

test("table-tennis board role resolves only the table-tennis department", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["tischtennis-vorstand"]), {
    departmentSlug: "tischtennis",
    conflict: false,
  });
});

test("unscoped roles receive no managed department", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["trainer"]), {
    departmentSlug: null,
    conflict: false,
  });
});

test("superadmin remains global when it also has a department role", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["superadmin", "fussball-vorstand"]), {
    departmentSlug: null,
    conflict: false,
  });
});

test("conflicting department-manager roles fail closed", () => {
  assert.deepEqual(resolveManagedDepartmentRole(["fussball-vorstand", "tischtennis-vorstand"]), {
    departmentSlug: null,
    conflict: true,
  });
});

test("department managers are denied on a foreign department route", () => {
  assert.equal(hasManagedDepartmentRouteMismatch({ managedDepartmentId: "football" }, "table-tennis"), true);
  assert.equal(hasManagedDepartmentRouteMismatch({ managedDepartmentId: "football" }, "football"), false);
  assert.equal(hasManagedDepartmentRouteMismatch({ isGlobal: true, managedDepartmentId: null }, "table-tennis"), false);
  assert.equal(hasManagedDepartmentRouteMismatch({}, "table-tennis"), false);
});
