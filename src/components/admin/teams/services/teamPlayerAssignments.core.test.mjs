import test from "node:test";
import assert from "node:assert/strict";
import { createPlayerAssignmentSyncPlan } from "./teamPlayerAssignments.core.mjs";

test("retains existing assignments without overwriting player metadata", () => {
  const plan = createPlayerAssignmentSyncPlan(
    [
      {
        id: "assignment-a",
        player_id: "player-a",
        shirt_number: 7,
        position_de: "Sturm",
        position_en: "Forward",
        is_captain: true,
        is_active: true,
        sort_order: 0,
      },
    ],
    ["player-a"],
  );

  assert.deepEqual(plan, {
    addedAssignments: [],
    removedAssignmentIds: [],
    retainedAssignments: [],
  });
});

test("updates only roster ordering for retained assignments", () => {
  const plan = createPlayerAssignmentSyncPlan(
    [
      { id: "assignment-a", player_id: "player-a", sort_order: 1, is_active: true },
      { id: "assignment-b", player_id: "player-b", sort_order: 0, is_active: true },
    ],
    ["player-a", "player-b"],
  );

  assert.deepEqual(plan.retainedAssignments, [
    { id: "assignment-a", sort_order: 0, is_active: true },
    { id: "assignment-b", sort_order: 1, is_active: true },
  ]);
  assert.equal("shirt_number" in plan.retainedAssignments[0], false);
  assert.equal("position_de" in plan.retainedAssignments[0], false);
});

test("adds and removes only changed roster assignments", () => {
  const plan = createPlayerAssignmentSyncPlan(
    [
      { id: "assignment-a", player_id: "player-a", sort_order: 0, is_active: true },
      { id: "assignment-b", player_id: "player-b", sort_order: 1, is_active: true },
    ],
    ["player-a", "player-c"],
  );

  assert.deepEqual(plan.addedAssignments, [
    { player_id: "player-c", sort_order: 1, is_active: true },
  ]);
  assert.deepEqual(plan.removedAssignmentIds, ["assignment-b"]);
});

test("rejects an inconsistent roster with duplicate player assignments", () => {
  assert.throws(
    () =>
      createPlayerAssignmentSyncPlan(
        [
          { id: "one", player_id: "player-a" },
          { id: "two", player_id: "player-a" },
        ],
        ["player-a"],
      ),
    /Ungültiger bestehender Mannschaftskader/,
  );
});
