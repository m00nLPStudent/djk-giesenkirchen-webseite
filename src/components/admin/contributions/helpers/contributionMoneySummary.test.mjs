import test from "node:test";
import assert from "node:assert/strict";

import {
  getContributionDetailMoneyItems,
  getContributionOverviewMoneyItems,
} from "./contributionMoneySummary.js";

test("overview money summary keeps the four compact totals", () => {
  const items = getContributionOverviewMoneyItems({
    totalDue: "200.00",
    totalPaid: "75.00",
    totalWaived: "10.00",
    totalOutstanding: "115.00",
  });

  assert.deepEqual(
    items.map((item) => item.compactTitle),
    ["Soll", "Gezahlt", "Erlassen", "Offen"],
  );
  assert.equal(items.find((item) => item.key === "totalOutstanding")?.emphasis, true);
  assert.match(items[3].value, /^115,00/);
});

test("detail money summary exposes the four working amounts", () => {
  const items = getContributionDetailMoneyItems({
    amountDue: "120.00",
    amountPaid: "50.00",
    amountWaived: "0.00",
    amountOutstanding: "70.00",
  });

  assert.deepEqual(
    items.map((item) => item.title),
    ["Soll", "Gezahlt", "Erlassen", "Offen"],
  );
  assert.equal(items.find((item) => item.key === "amountOutstanding")?.emphasis, true);
});
