import test from "node:test";
import assert from "node:assert/strict";

import { loadContributionStats } from "./contributionStats.service.js";
import {
  EMPTY_CONTRIBUTION_STATS,
  createEmptyContributionStats,
} from "./contributionStats.defaults.js";

test("loadContributionStats returns the canonical empty stats object shape for an empty repository result", async () => {
  const stats = await loadContributionStats(
    {},
    {},
    {
      async loadFilteredContributions() {
        return [];
      },
      async loadCurrentSeasonResolution() {
        return { activeSeasonId: null };
      },
    },
  );

  assert.deepEqual(stats, EMPTY_CONTRIBUTION_STATS);
});

test("loadContributionStats normalizes null money fields to safe zero values", async () => {
  const stats = await loadContributionStats(
    {},
    {},
    {
      async loadFilteredContributions() {
        return [
          {
            id: "c-1",
            seasonId: "season-1",
            status: "open",
            isOverdue: false,
            amountDue: null,
            amountPaid: null,
            amountWaived: null,
            amountOutstanding: null,
          },
        ];
      },
      async loadCurrentSeasonResolution() {
        return { activeSeasonId: "season-1" };
      },
    },
  );

  assert.equal(stats.totalCount, 1);
  assert.equal(stats.totalDue, "0.00");
  assert.equal(stats.totalPaid, "0.00");
  assert.equal(stats.totalWaived, "0.00");
  assert.equal(stats.totalOutstanding, "0.00");
  assert.equal(stats.paymentsCurrentSeason, "0.00");
});

test("createEmptyContributionStats returns a fresh copy per request", () => {
  const first = createEmptyContributionStats();
  const second = createEmptyContributionStats();

  first.totalCount = 99;

  assert.equal(second.totalCount, 0);
  assert.equal(EMPTY_CONTRIBUTION_STATS.totalCount, 0);
});

test("loadContributionStats calculates totals and splits canceled rows correctly", async () => {
  const stats = await loadContributionStats(
    {},
    {},
    {
      async loadFilteredContributions() {
        return [
          {
            id: "c-1",
            seasonId: "season-1",
            status: "open",
            isOverdue: true,
            amountDue: "100.00",
            amountPaid: "0.00",
            amountWaived: "0.00",
            amountOutstanding: "100.00",
          },
          {
            id: "c-2",
            seasonId: "season-1",
            status: "partially_paid",
            isOverdue: false,
            amountDue: "80.00",
            amountPaid: "30.00",
            amountWaived: "0.00",
            amountOutstanding: "50.00",
          },
          {
            id: "c-3",
            seasonId: "season-1",
            status: "paid",
            isOverdue: false,
            amountDue: "40.00",
            amountPaid: "40.00",
            amountWaived: "0.00",
            amountOutstanding: "0.00",
          },
          {
            id: "c-4",
            seasonId: "season-2",
            status: "exempt",
            isOverdue: false,
            amountDue: "20.00",
            amountPaid: "0.00",
            amountWaived: "20.00",
            amountOutstanding: "0.00",
          },
          {
            id: "c-5",
            seasonId: "season-2",
            status: "canceled",
            isOverdue: false,
            amountDue: "60.00",
            amountPaid: "0.00",
            amountWaived: "0.00",
            amountOutstanding: "0.00",
          },
        ];
      },
      async loadCurrentSeasonResolution() {
        return { activeSeasonId: "season-1" };
      },
    },
  );

  assert.equal(stats.totalCount, 5);
  assert.equal(stats.canceledCount, 1);
  assert.equal(stats.exemptCount, 1);
  assert.equal(stats.overdueCount, 1);
  assert.equal(stats.totalDue, "240.00");
  assert.equal(stats.totalPaid, "70.00");
  assert.equal(stats.totalWaived, "20.00");
  assert.equal(stats.totalOutstanding, "150.00");
  assert.equal(stats.paymentsCurrentSeason, "70.00");
});
