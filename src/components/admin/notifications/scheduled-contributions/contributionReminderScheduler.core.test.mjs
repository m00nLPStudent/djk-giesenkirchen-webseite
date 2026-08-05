import test from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedSchedulerRequest, publicRunReport } from "./contributionReminderScheduler.core.mjs";

test("scheduler accepts only the exact bearer secret", () => {
  assert.equal(isAuthorizedSchedulerRequest("Bearer correct", "correct"), true);
  assert.equal(isAuthorizedSchedulerRequest("Bearer wrong", "correct"), false);
  assert.equal(isAuthorizedSchedulerRequest(null, "correct"), false);
  assert.equal(isAuthorizedSchedulerRequest("Bearer correct", ""), false);
});
test("public report contains counts but no contribution or person data", () => {
  const report = publicRunReport({ ok: true, runId: "r", businessDate: "2026-08-05", scannedCount: 2, playerName: "Secret", amount: 99 });
  assert.equal(report.scannedCount, 2);
  assert.equal(JSON.stringify(report).includes("Secret"), false);
  assert.equal(Object.hasOwn(report, "amount"), false);
});
