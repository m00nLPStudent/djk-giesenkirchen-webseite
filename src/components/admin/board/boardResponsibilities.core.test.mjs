import assert from "node:assert/strict";
import test from "node:test";

import {
  BOARD_RESPONSIBILITY_LIMIT,
  BOARD_RESPONSIBILITY_MAX_LENGTH,
  boardResponsibilityKey,
  findBoardResponsibilities,
  normalizeBoardResponsibilities,
  normalizeBoardResponsibilityTarget,
} from "./boardResponsibilities.core.mjs";

test("responsibilities are trimmed, empty values removed and order retained", () => {
  assert.deepEqual(normalizeBoardResponsibilities(["  Leitung ", "", " Planung", "   "]), {
    ok: true,
    data: ["Leitung", "Planung"],
  });
});

test("responsibility count and text length are bounded", () => {
  assert.equal(normalizeBoardResponsibilities(Array.from({ length: BOARD_RESPONSIBILITY_LIMIT + 1 }, () => "Aufgabe")).ok, false);
  assert.equal(normalizeBoardResponsibilities(["x".repeat(BOARD_RESPONSIBILITY_MAX_LENGTH + 1)]).ok, false);
});

test("club and department targets are validated fail closed", () => {
  assert.deepEqual(normalizeBoardResponsibilityTarget({ organization_scope: "club", department_id: null, role_id: "role" }).data, {
    organization_scope: "club", department_id: null, role_id: "role",
  });
  assert.equal(normalizeBoardResponsibilityTarget({ organization_scope: "club", department_id: "football", role_id: "role" }).ok, false);
  assert.equal(normalizeBoardResponsibilityTarget({ organization_scope: "department", department_id: null, role_id: "role" }).ok, false);
});

test("lookup correlates scope, department and role instead of role alone", () => {
  const rows = [
    { organization_scope: "club", department_id: null, role_id: "shared", responsibilities: ["Club"] },
    { organization_scope: "department", department_id: "football", role_id: "shared", responsibilities: ["Football"] },
    { organization_scope: "department", department_id: "tt", role_id: "shared", responsibilities: ["Tischtennis"] },
  ];
  assert.deepEqual(findBoardResponsibilities(rows, { organization_scope: "club", department_id: null, role_id: "shared" }), ["Club"]);
  assert.deepEqual(findBoardResponsibilities(rows, { organization_scope: "department", department_id: "football", role_id: "shared" }), ["Football"]);
  assert.deepEqual(findBoardResponsibilities(rows, { organization_scope: "department", department_id: "tt", role_id: "shared" }), ["Tischtennis"]);
  assert.notEqual(boardResponsibilityKey(rows[1]), boardResponsibilityKey(rows[2]));
});
