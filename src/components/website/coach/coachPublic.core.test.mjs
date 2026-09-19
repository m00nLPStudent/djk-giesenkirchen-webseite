import test from "node:test";
import assert from "node:assert/strict";
import { sortPublicCoachesByPrimaryTeam } from "./coachPublic.core.mjs";

function coach(id, options = {}) {
  const assignments = options.assignments || [];
  return {
    id,
    displayName: options.displayName || id,
    sortOrder: options.sortOrder ?? null,
    assignments,
    primaryAssignment: assignments[0] || null,
  };
}

test("primary team order controls the public coach sequence", () => {
  const result = sortPublicCoachesByPrimaryTeam([
    coach("senior", { assignments: [{ teamSortOrder: 90, sortOrder: 1 }] }),
    coach("bambini", { assignments: [{ teamSortOrder: 10, sortOrder: 1 }] }),
    coach("d-jugend", { assignments: [{ teamSortOrder: 40, sortOrder: 1 }] }),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["bambini", "d-jugend", "senior"]);
});

test("only the first assignment positions a multiply assigned coach", () => {
  const multi = coach("multi", {
    assignments: [
      { teamSortOrder: 10, sortOrder: 1 },
      { teamSortOrder: 70, sortOrder: 1 },
    ],
  });
  const result = sortPublicCoachesByPrimaryTeam([
    coach("middle", { assignments: [{ teamSortOrder: 40, sortOrder: 1 }] }),
    multi,
  ]);
  assert.deepEqual(result.map((item) => item.id), ["multi", "middle"]);
  assert.equal(result.filter((item) => item.id === "multi").length, 1);
});

test("assignment, coach and name order provide deterministic same-team fallbacks", () => {
  const result = sortPublicCoachesByPrimaryTeam([
    coach("third", { displayName: "Clara", sortOrder: 1, assignments: [{ teamSortOrder: 20, sortOrder: 2 }] }),
    coach("second", { displayName: "Berta", sortOrder: 2, assignments: [{ teamSortOrder: 20, sortOrder: 1 }] }),
    coach("first", { displayName: "Anna", sortOrder: 1, assignments: [{ teamSortOrder: 20, sortOrder: 1 }] }),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["first", "second", "third"]);
});

test("coaches without a current assignment sort after assigned coaches", () => {
  const result = sortPublicCoachesByPrimaryTeam([
    coach("unassigned", { sortOrder: 1 }),
    coach("assigned", { assignments: [{ teamSortOrder: 999, sortOrder: 10 }] }),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["assigned", "unassigned"]);
});

test("missing and empty team order values remain unassigned-order fallbacks", () => {
  const result = sortPublicCoachesByPrimaryTeam([
    coach("missing-order", { assignments: [{ teamSortOrder: null, sortOrder: 1 }] }),
    coach("ordered", { assignments: [{ teamSortOrder: 50, sortOrder: 1 }] }),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["ordered", "missing-order"]);
});
