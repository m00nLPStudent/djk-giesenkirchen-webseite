import test from "node:test";
import assert from "node:assert/strict";

import {
  loadContributionsExportData,
  loadContributionsOverviewData,
} from "./contributionUiData.service.js";

const FIXTURE_CONTRIBUTIONS = [
  {
    id: "c-1",
    seasonId: "season-1",
    playerId: "player-1",
    playerFirstName: "Anna",
    playerLastName: "Becker",
    playerDisplayName: "Anna Becker",
    title: "Regelbeitrag 2026",
    status: "open",
    contributionKey: "regular",
    dueDate: "2026-01-10",
    isOverdue: true,
    amountDue: "120.00",
    amountPaid: "0.00",
    amountWaived: "0.00",
    amountOutstanding: "120.00",
    lastPaymentAt: null,
    createdAt: "2025-12-01T10:00:00.000Z",
    seasonName: "2026/27",
    teamSnapshotName: "U19",
  },
  {
    id: "c-2",
    seasonId: "season-1",
    playerId: "player-2",
    playerFirstName: "Mia",
    playerLastName: "Fischer",
    playerDisplayName: "Mia Fischer",
    title: "Sonderbeitrag Trainingslager",
    status: "partially_paid",
    contributionKey: "special_fee",
    dueDate: "2026-03-15",
    isOverdue: false,
    amountDue: "90.00",
    amountPaid: "30.00",
    amountWaived: "0.00",
    amountOutstanding: "60.00",
    lastPaymentAt: "2026-03-01T09:00:00.000Z",
    createdAt: "2026-02-01T10:00:00.000Z",
    seasonName: "2026/27",
    teamSnapshotName: "U17",
  },
  {
    id: "c-3",
    seasonId: "season-2",
    playerId: "player-3",
    playerFirstName: "Mia",
    playerLastName: "Sommer",
    playerDisplayName: "Mia Sommer",
    title: "Regelbeitrag 2025",
    status: "open",
    contributionKey: "regular",
    dueDate: "2025-04-20",
    isOverdue: true,
    amountDue: "110.00",
    amountPaid: "0.00",
    amountWaived: "0.00",
    amountOutstanding: "110.00",
    lastPaymentAt: null,
    createdAt: "2025-01-01T10:00:00.000Z",
    seasonName: "2025/26",
    teamSnapshotName: "U15",
  },
];

function createTestDeps() {
  return {
    async loadContributionFormOptions() {
      return {
        currentSeasonId: "season-1",
        currentSeasonStatus: "resolved",
        seasons: [
          { value: "season-1", label: "2026/27", isCurrent: true },
          { value: "season-2", label: "2025/26", isCurrent: false },
        ],
        players: [
          { value: "player-1", label: "Anna Becker", isActive: true },
          { value: "player-2", label: "Mia Fischer", isActive: true },
          { value: "player-3", label: "Mia Sommer", isActive: true },
        ],
      };
    },
    async loadContributionTeamSnapshotOptions() {
      return ["U19", "U17", "U15"];
    },
    async loadFilteredContributions(_, filters = {}) {
      return FIXTURE_CONTRIBUTIONS.filter((item) => {
        if (filters.seasonId && item.seasonId !== filters.seasonId) return false;
        if (filters.playerId && item.playerId !== filters.playerId) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (
          filters.contributionKey &&
          item.contributionKey !== filters.contributionKey
        ) {
          return false;
        }
        if (filters.teamSnapshotName && item.teamSnapshotName !== filters.teamSnapshotName) {
          return false;
        }
        if (filters.dueDate && item.dueDate !== filters.dueDate) return false;
        if (filters.overdue && !item.isOverdue) return false;
        return true;
      });
    },
  };
}

test("loadContributionsOverviewData defaults to current season, sorts overdue first and paginates", async () => {
  const data = await loadContributionsOverviewData(
    {},
    { page: "1", pageSize: "25" },
    createTestDeps(),
  );

  assert.equal(data.filters.seasonId, "season-1");
  assert.equal(data.pagination.totalCount, 2);
  assert.equal(data.pagination.page, 1);
  assert.equal(data.pagination.pageSize, 25);
  assert.equal(data.contributions.length, 2);
  assert.equal(data.contributions[0].id, "c-1");
  assert.equal(data.contributions[1].id, "c-2");
  assert.equal(data.stats.totalCount, 2);
  assert.equal(data.stats.overdueCount, 1);
  assert.deepEqual(data.filterOptions.teams, ["U19", "U17", "U15"]);
});

test("loadContributionsOverviewData returns empty overview data without crashing", async () => {
  const data = await loadContributionsOverviewData(
    {},
    {},
    {
      ...createTestDeps(),
      async loadFilteredContributions() {
        return [];
      },
    },
  );

  assert.equal(data.hasAnyContributions, false);
  assert.equal(data.contributions.length, 0);
  assert.equal(data.pagination.totalCount, 0);
  assert.equal(data.stats.totalCount, 0);
  assert.equal(data.stats.totalPaid, "0.00");
  assert.equal(data.stats.totalOutstanding, "0.00");
});

test("loadContributionsOverviewData keeps filters with no season or status hits stable", async () => {
  const data = await loadContributionsOverviewData(
    {},
    { season: "season-2", status: "paid" },
    createTestDeps(),
  );

  assert.equal(data.filters.seasonId, "season-2");
  assert.equal(data.filters.status, "paid");
  assert.equal(data.contributions.length, 0);
  assert.equal(data.stats.totalCount, 0);
});

test("loadContributionsExportData applies filter, search and sorting before export", async () => {
  const data = await loadContributionsExportData(
    {},
    {
      season: "season-2",
      status: "open",
      overdue: "true",
      search: "mia",
      sort: "player_name",
    },
    createTestDeps(),
  );

  assert.equal(data.contributions.length, 1);
  assert.equal(data.contributions[0].id, "c-3");
  assert.equal(data.filters.search, "mia");
  assert.equal(data.filters.status, "open");
});
