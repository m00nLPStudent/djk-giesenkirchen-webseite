import test from "node:test";
import assert from "node:assert/strict";
import { classifyScheduledContributionReminder as classify, createScheduledContributionIdempotencyKey as key, getBerlinDate, isBerlinDispatchWindow, isRecurringOverdueDay } from "./scheduledContributionReminder.core.mjs";

const base = { id: "c1", dueDate: "2026-08-15", outstandingCents: 1000, status: "open" };
test("implements exactly 14/7/0/+7 and every 14 days thereafter", () => {
  assert.equal(classify(base, "2026-08-01").stage, "due_soon_14");
  assert.equal(classify(base, "2026-08-08").stage, "due_soon_7");
  assert.equal(classify(base, "2026-08-15").stage, "due_today");
  for (const day of [7, 21, 35, 49, 63]) assert.equal(isRecurringOverdueDay(day), true);
  for (const day of [8, 20, 22]) assert.equal(isRecurringOverdueDay(day), false);
});
test("partial, paid, waived and invalid amounts are classified safely", () => {
  assert.equal(classify({ ...base, status: "partially_paid" }, "2026-08-22").type, "membership_payment_partial_open");
  for (const row of [{ ...base, status: "paid" }, { ...base, status: "exempt" }, { ...base, status: "canceled" }, { ...base, outstandingCents: 0 }, { ...base, outstandingCents: -1 }, { ...base, dueDate: null }]) assert.equal(classify(row, "2026-08-15"), null);
});
test("archived member does not erase an otherwise open financial claim", () => assert.equal(classify({ ...base, memberActive: false, archived: true }, "2026-08-15").type, "membership_payment_due_today"));
test("deferral suppresses before end, emits once on end, then uses original due date", () => {
  assert.equal(classify({ ...base, status: "deferred", deferredUntil: "2026-08-20" }, "2026-08-15"), null);
  assert.equal(classify({ ...base, status: "deferred", deferredUntil: "2026-08-20" }, "2026-08-20").type, "membership_payment_deferral_ending");
});
test("idempotency contains non-personal business dimensions", () => assert.equal(key({ type: "membership_payment_overdue", contributionId: "c1", recipientUserId: "u1", stage: "overdue_21", businessDate: "2026-09-05", contributionYear: "2026" }), "membership_payment_overdue:c1:u1:overdue_21:2026-09-05:2026"));
test("Berlin date and 08:00 window survive winter and summer UTC offsets", () => {
  assert.equal(getBerlinDate(new Date("2026-01-31T23:30:00Z")), "2026-02-01");
  assert.equal(getBerlinDate(new Date("2026-07-31T22:30:00Z")), "2026-08-01");
  assert.equal(isBerlinDispatchWindow(new Date("2026-01-15T07:00:00Z")), true);
  assert.equal(isBerlinDispatchWindow(new Date("2026-07-15T06:00:00Z")), true);
});
