import test from "node:test";
import assert from "node:assert/strict";

import { buildContributionActionItems } from "./contributionActions.js";

const openContribution = {
  id: "c-1",
  status: "open",
  amountPaid: "0.00",
};

test("vorstand only sees details", () => {
  const items = buildContributionActionItems(openContribution, [
    "contributions.view",
  ]);

  assert.deepEqual(items.map((item) => item.label), ["Details"]);
});

test("superadmin sees all open contribution actions", () => {
  const items = buildContributionActionItems(openContribution, [
    "contributions.view",
    "contributions.edit",
    "contributions.record_payment",
    "contributions.defer",
    "contributions.exempt",
    "contributions.cancel",
  ]);

  assert.deepEqual(items.map((item) => item.label), [
    "Details",
    "Bearbeiten",
    "Zahlung erfassen",
    "Stundung",
    "Befreien",
    "Beitrag stornieren",
  ]);
});

test("exempt contributions hide invalid actions", () => {
  const items = buildContributionActionItems(
    {
      id: "c-2",
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

  assert.deepEqual(items.map((item) => item.label), ["Details"]);
});

