import test from "node:test";
import assert from "node:assert/strict";

import {
  cancelContributionPayment,
  recordContributionPayment,
} from "./contributionPayment.service.js";

const context = { db: {}, actorProfileId: "admin-1" };

function recordDeps(overrides = {}) {
  return {
    async loadContributionRecordById() {
      return {
        data: {
          id: "c-1",
          status: "open",
          amount_outstanding: "30.00",
        },
        error: null,
      };
    },
    async insertContributionPayment() {
      return { data: { id: "p-1" }, error: null };
    },
    async loadContributionById() {
      return { id: "c-1", contributionId: "c-1", amountPaid: "10.00" };
    },
    ...overrides,
  };
}

function cancelDeps(overrides = {}) {
  return {
    async loadPaymentRecordById() {
      return {
        data: {
          id: "p-1",
          contribution_id: "c-1",
          status: "booked",
        },
        error: null,
      };
    },
    async updateContributionPaymentRecord() {
      return { data: { id: "p-1" }, error: null };
    },
    async loadContributionById() {
      return { id: "c-1", contributionId: "c-1" };
    },
    ...overrides,
  };
}

test("recordContributionPayment accepts a valid payment", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "10", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps(),
  );
  assert.equal(result.ok, true);
});

test("recordContributionPayment accepts a partial payment", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "5", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps(),
  );
  assert.equal(result.ok, true);
});

test("recordContributionPayment accepts a final payment", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "30", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps(),
  );
  assert.equal(result.ok, true);
});

test("recordContributionPayment rejects overpayments", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "31", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps(),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "PAYMENT_EXCEEDS_OUTSTANDING");
});

test("recordContributionPayment rejects canceled contributions", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "10", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps({
      async loadContributionRecordById() {
        return {
          data: { id: "c-1", status: "canceled", amount_outstanding: "30.00" },
          error: null,
        };
      },
    }),
  );
  assert.equal(result.code, "CONTRIBUTION_CANCELED");
});

test("recordContributionPayment rejects exempt contributions", async () => {
  const result = await recordContributionPayment(
    { contributionId: "c-1", amount: "10", paidAt: "2026-08-01T12:00:00Z" },
    context,
    recordDeps({
      async loadContributionRecordById() {
        return {
          data: { id: "c-1", status: "exempt", amount_outstanding: "0.00" },
          error: null,
        };
      },
    }),
  );
  assert.equal(result.code, "CONTRIBUTION_EXEMPT");
});

test("cancelContributionPayment accepts a booked payment", async () => {
  const result = await cancelContributionPayment(
    { paymentId: "p-1", cancellationReason: "Fehlbuchung" },
    context,
    cancelDeps(),
  );
  assert.equal(result.ok, true);
});

test("cancelContributionPayment rejects an already canceled payment", async () => {
  const result = await cancelContributionPayment(
    { paymentId: "p-1", cancellationReason: "Fehlbuchung" },
    context,
    cancelDeps({
      async loadPaymentRecordById() {
        return {
          data: { id: "p-1", contribution_id: "c-1", status: "canceled" },
          error: null,
        };
      },
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "PAYMENT_ALREADY_CANCELED");
});
