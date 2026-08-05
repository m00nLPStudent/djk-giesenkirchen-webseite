import test from "node:test";
import assert from "node:assert/strict";
import { isMembershipRequestAssignedToCoach } from "./membershipRequestRecordAccess.core.mjs";

test("trainer access matches only the personally assigned coach id", () => {
  const request = { id: "r-1", forwarded_to_type: "coach", forwarded_to_id: "coach-1" };
  assert.equal(isMembershipRequestAssignedToCoach(request, "coach-1"), true);
  assert.equal(isMembershipRequestAssignedToCoach(request, "coach-2"), false);
  assert.equal(isMembershipRequestAssignedToCoach(request, null), false);
});

test("board assignment and revoked assignment never grant coach access", () => {
  assert.equal(isMembershipRequestAssignedToCoach({ forwarded_to_type: "board", forwarded_to_id: "coach-1" }, "coach-1"), false);
  assert.equal(isMembershipRequestAssignedToCoach({ forwarded_to_type: null, forwarded_to_id: null }, "coach-1"), false);
});
