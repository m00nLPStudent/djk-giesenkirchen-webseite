import test from "node:test";
import assert from "node:assert/strict";
import { validateActiveTeamDepartment, validateTeamDepartmentId } from "./teamDepartments.core.mjs";

test("team create and edit accept a normalized department UUID", () => {
  const id = "7c3bcc82-c219-48be-89d5-4f9232f69c84";
  assert.deepEqual(validateTeamDepartmentId(` ${id} `), { data: id, error: null });
});

test("missing and malformed department IDs are rejected", () => {
  for (const value of [null, "", "fussball", "43e93830-1f0e-48a0-83d2-1ee5cebd3099-extra"]) {
    assert.equal(validateTeamDepartmentId(value).data, null);
  }
});

test("inactive, missing and mismatched departments are rejected server-side", () => {
  const id = "7c3bcc82-c219-48be-89d5-4f9232f69c84";
  assert.deepEqual(validateActiveTeamDepartment(id, { id, is_active: true }), { data: id, error: null });
  for (const department of [null, { id, is_active: false }, { id: "43e93830-1f0e-48a0-83d2-1ee5cebd3099", is_active: true }]) {
    assert.equal(validateActiveTeamDepartment(id, department).data, null);
  }
});
