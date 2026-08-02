import test from "node:test";
import assert from "node:assert/strict";

import {
  cancelContribution,
  deferContribution,
  exemptContribution,
  resumeContribution,
} from "./contributionState.service.js";

const context = { db: {}, actorProfileId: "admin-1" };

function createDeps(contribution, overrides = {}) {
  return {
    async loadContributionRecordById() {
      return { data: contribution, error: null };
    },
    async updateContributionRecord() {
      return { data: { id: contribution.id }, error: null };
    },
    async loadContributionById() {
      return { id: contribution.id, contributionId: contribution.id };
    },
    ...overrides,
  };
}

test("deferContribution accepts a valid defer", async () => {
  const result = await deferContribution(
    {
      contributionId: "c-1",
      deferredUntil: "2026-10-01",
      deferredReason: "Ratenabrede",
    },
    context,
    createDeps({ id: "c-1", status: "open", amount_due: "50.00", amount_paid: "0.00" }),
  );
  assert.equal(result.ok, true);
});

test("deferContribution requires a date", async () => {
  const result = await deferContribution(
    { contributionId: "c-1", deferredReason: "Ratenabrede" },
    context,
    createDeps({ id: "c-1", status: "open" }),
  );
  assert.equal(result.code, "VALIDATION_ERROR");
});

test("deferContribution requires a reason", async () => {
  const result = await deferContribution(
    { contributionId: "c-1", deferredUntil: "2026-10-01" },
    context,
    createDeps({ id: "c-1", status: "open" }),
  );
  assert.equal(result.code, "VALIDATION_ERROR");
});

test("deferContribution rejects paid contributions", async () => {
  const result = await deferContribution(
    {
      contributionId: "c-1",
      deferredUntil: "2026-10-01",
      deferredReason: "Ratenabrede",
    },
    context,
    createDeps({ id: "c-1", status: "paid" }),
  );
  assert.equal(result.code, "CONTRIBUTION_ALREADY_PAID");
});

test("resumeContribution accepts a deferred contribution", async () => {
  const result = await resumeContribution(
    { contributionId: "c-1" },
    context,
    createDeps({
      id: "c-1",
      status: "deferred",
      amount_due: "50.00",
      amount_paid: "10.00",
      amount_waived: "0.00",
    }),
  );
  assert.equal(result.ok, true);
});

test("exemptContribution accepts a full exemption", async () => {
  const result = await exemptContribution(
    { contributionId: "c-1", exemptionReason: "Sozialentscheidung" },
    context,
    createDeps({
      id: "c-1",
      status: "open",
      amount_due: "50.00",
      amount_paid: "0.00",
    }),
  );
  assert.equal(result.ok, true);
});

test("exemptContribution requires a reason", async () => {
  const result = await exemptContribution(
    { contributionId: "c-1" },
    context,
    createDeps({ id: "c-1", status: "open", amount_due: "50.00", amount_paid: "0.00" }),
  );
  assert.equal(result.code, "VALIDATION_ERROR");
});

test("exemptContribution rejects contributions with payments", async () => {
  const result = await exemptContribution(
    { contributionId: "c-1", exemptionReason: "Sozialentscheidung" },
    context,
    createDeps({ id: "c-1", status: "partially_paid", amount_due: "50.00", amount_paid: "10.00" }),
  );
  assert.equal(result.code, "PAYMENT_EXISTS");
});

test("exemptContribution rejects canceled contributions", async () => {
  const result = await exemptContribution(
    { contributionId: "c-1", exemptionReason: "Sozialentscheidung" },
    context,
    createDeps({ id: "c-1", status: "canceled", amount_due: "50.00", amount_paid: "0.00" }),
  );
  assert.equal(result.code, "CONTRIBUTION_CANCELED");
});

test("cancelContribution accepts a contribution without payments", async () => {
  const result = await cancelContribution(
    { contributionId: "c-1", cancellationReason: "Irrelevant" },
    context,
    createDeps({ id: "c-1", status: "open", amount_paid: "0.00" }),
  );
  assert.equal(result.ok, true);
});

test("cancelContribution rejects a contribution with booked payments", async () => {
  const result = await cancelContribution(
    { contributionId: "c-1", cancellationReason: "Irrelevant" },
    context,
    createDeps({ id: "c-1", status: "partially_paid", amount_paid: "10.00" }),
  );
  assert.equal(result.code, "PAYMENT_EXISTS");
});

test("cancelContribution rejects an already canceled contribution", async () => {
  const result = await cancelContribution(
    { contributionId: "c-1", cancellationReason: "Irrelevant" },
    context,
    createDeps({ id: "c-1", status: "canceled", amount_paid: "0.00" }),
  );
  assert.equal(result.code, "CONTRIBUTION_CANCELED");
});
