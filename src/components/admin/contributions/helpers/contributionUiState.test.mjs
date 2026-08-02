import test from "node:test";
import assert from "node:assert/strict";

import { getContributionUiState } from "./contributionUiState.js";

test("getContributionUiState keeps vorstand read-only except export", () => {
  const state = getContributionUiState(
    {
      status: "open",
      amountPaid: "0.00",
    },
    ["contributions.view", "contributions.export"],
  );

  assert.equal(state.canCreate, false);
  assert.equal(state.canEdit, false);
  assert.equal(state.canRecordPayment, false);
  assert.equal(state.canExport, true);
});

test("getContributionUiState blocks editing for canceled contributions", () => {
  const state = getContributionUiState(
    {
      status: "canceled",
      amountPaid: "0.00",
    },
    [
      "contributions.view",
      "contributions.edit",
      "contributions.record_payment",
      "contributions.cancel",
    ],
  );

  assert.equal(state.canEdit, false);
  assert.equal(state.canRecordPayment, false);
  assert.equal(state.canCancel, false);
  assert.equal(state.isLocked, true);
});

test("getContributionUiState tolerates a null contribution for empty overview actions", () => {
  const state = getContributionUiState(null, [
    "contributions.view",
    "contributions.create",
    "contributions.export",
  ]);

  assert.equal(state.canCreate, true);
  assert.equal(state.canExport, true);
  assert.equal(state.canExempt, false);
});

test("getContributionUiState keeps exempt contributions read-only", () => {
  const state = getContributionUiState(
    {
      status: "exempt",
      amountPaid: "0.00",
    },
    [
      "contributions.view",
      "contributions.edit",
      "contributions.record_payment",
      "contributions.defer",
      "contributions.exempt",
      "contributions.cancel",
    ],
  );

  assert.equal(state.canEdit, false);
  assert.equal(state.canRecordPayment, false);
  assert.equal(state.canDefer, false);
  assert.equal(state.canExempt, false);
  assert.equal(state.canCancel, false);
  assert.equal(state.isLocked, true);
});

test("getContributionUiState exposes defer resume but no new payment for deferred items", () => {
  const state = getContributionUiState(
    {
      status: "deferred",
      amountPaid: "0.00",
    },
    ["contributions.view", "contributions.defer", "contributions.record_payment"],
  );

  assert.equal(state.canResume, true);
  assert.equal(state.canDefer, true);
  assert.equal(state.canRecordPayment, false);
});
