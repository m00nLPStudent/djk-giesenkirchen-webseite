import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_CODES,
  isOutstandingContribution,
  runArchiveSteps,
  summarizeOutstandingContributions,
} from "./archiveCore.mjs";

test("only open contribution states with a positive balance are outstanding", () => {
  for (const status of ["open", "partially_paid", "deferred"]) {
    assert.equal(isOutstandingContribution({ status, amount_outstanding: "1.00" }), true);
  }
  for (const status of ["paid", "exempt", "canceled"]) {
    assert.equal(isOutstandingContribution({ status, amount_outstanding: "1.00" }), false);
  }
  assert.equal(isOutstandingContribution({ status: "open", amount_outstanding: "0.00" }), false);
});

test("outstanding summary preserves count and amount", () => {
  assert.deepEqual(summarizeOutstandingContributions([
    { status: "open", amount_outstanding: "10.50" },
    { status: "deferred", amount_outstanding: "4.50" },
    { status: "paid", amount_outstanding: "9.00" },
  ]), { count: 2, amount: 15 });
});

test("a partial failure invokes rollback", async () => {
  const calls = [];
  const result = await runArchiveSteps([
    async () => calls.push("first"),
    async () => { throw new Error("failure"); },
  ], async () => calls.push("rollback"));
  assert.equal(result.code, ARCHIVE_CODES.DATABASE_ERROR);
  assert.deepEqual(calls, ["first", "rollback"]);
});
