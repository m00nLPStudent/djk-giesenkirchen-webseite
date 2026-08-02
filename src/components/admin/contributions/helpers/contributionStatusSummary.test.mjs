import test from "node:test";
import assert from "node:assert/strict";

import {
  buildPlayerContributionStatusMap,
  createPlayerContributionStatusDto,
  createTeamContributionSummary,
  getContributionSeasonWarning,
} from "./contributionStatusSummary.js";

test("player contribution status prefers an active regular contribution", () => {
  const status = createPlayerContributionStatusDto("player-1", "season-1", [
    {
      id: "special-1",
      player_id: "player-1",
      season_id: "season-1",
      contribution_key: "special_fee",
      amount_due: "10.00",
      amount_paid: "0.00",
      amount_waived: "0.00",
      status: "open",
      due_date: "2026-09-10",
      created_at: "2026-01-01",
    },
    {
      id: "regular-1",
      player_id: "player-1",
      season_id: "season-1",
      contribution_key: "regular",
      amount_due: "100.00",
      amount_paid: "25.00",
      amount_waived: "0.00",
      status: "partially_paid",
      due_date: "2026-09-01",
      created_at: "2026-01-02",
    },
  ]);

  assert.equal(status.contributionId, "regular-1");
  assert.equal(status.status, "partially_paid");
  assert.equal(status.displayStatus, "Teilweise bezahlt");
});

test("player contribution status aggregates active non-regular rows when no regular exists", () => {
  const status = createPlayerContributionStatusDto("player-2", "season-1", [
    {
      id: "special-1",
      player_id: "player-2",
      season_id: "season-1",
      contribution_key: "special_fee",
      amount_due: "10.00",
      amount_paid: "10.00",
      amount_waived: "0.00",
      status: "paid",
      due_date: "2026-08-01",
      created_at: "2026-01-01",
    },
    {
      id: "special-2",
      player_id: "player-2",
      season_id: "season-1",
      contribution_key: "adjustment",
      amount_due: "20.00",
      amount_paid: "0.00",
      amount_waived: "0.00",
      status: "open",
      due_date: "2026-08-15",
      created_at: "2026-01-02",
    },
  ]);

  assert.equal(status.contributionId, null);
  assert.equal(status.status, "partially_paid");
  assert.equal(status.amountDue, "30.00");
  assert.equal(status.amountPaid, "10.00");
  assert.equal(status.amountOutstanding, "20.00");
});

test("duplicate active regular contributions emit a technical warning", () => {
  const status = createPlayerContributionStatusDto("player-3", "season-1", [
    {
      id: "regular-1",
      player_id: "player-3",
      season_id: "season-1",
      contribution_key: "regular",
      amount_due: "100.00",
      amount_paid: "0.00",
      amount_waived: "0.00",
      status: "open",
      due_date: "2026-09-01",
      created_at: "2026-01-01",
    },
    {
      id: "regular-2",
      player_id: "player-3",
      season_id: "season-1",
      contribution_key: "regular",
      amount_due: "100.00",
      amount_paid: "0.00",
      amount_waived: "0.00",
      status: "open",
      due_date: "2026-10-01",
      created_at: "2026-01-02",
    },
  ]);

  assert.equal(status.warningCode, "MULTIPLE_REGULAR");
});

test("team summary counts missing, overdue and open values from player status map", () => {
  const playerStatusMap = buildPlayerContributionStatusMap(
    ["player-1", "player-2", "player-3"],
    "season-1",
    [
      {
        id: "regular-1",
        player_id: "player-1",
        season_id: "season-1",
        contribution_key: "regular",
        amount_due: "100.00",
        amount_paid: "100.00",
        amount_waived: "0.00",
        status: "paid",
        due_date: "2026-09-01",
        created_at: "2026-01-01",
      },
      {
        id: "regular-2",
        player_id: "player-2",
        season_id: "season-1",
        contribution_key: "regular",
        amount_due: "100.00",
        amount_paid: "25.00",
        amount_waived: "0.00",
        status: "partially_paid",
        due_date: "2020-09-01",
        created_at: "2026-01-01",
      },
    ],
  );

  const summary = createTeamContributionSummary(
    "team-1",
    "season-1",
    ["player-1", "player-2", "player-3"],
    playerStatusMap,
  );

  assert.equal(summary.playerCount, 3);
  assert.equal(summary.contributionCount, 2);
  assert.equal(summary.paidCount, 1);
  assert.equal(summary.partiallyPaidCount, 1);
  assert.equal(summary.overdueCount, 1);
  assert.equal(summary.missingContributionCount, 1);
  assert.equal(summary.totalOutstanding, "75.00");
});

test("season warnings are explicit when current season is missing or ambiguous", () => {
  assert.match(
    getContributionSeasonWarning({ activeSeasonStatus: "CURRENT_SEASON_MISSING" }),
    /keine aktuelle Saison/i,
  );
  assert.match(
    getContributionSeasonWarning({ activeSeasonStatus: "CURRENT_SEASON_AMBIGUOUS" }),
    /mehrere aktuelle Saisons/i,
  );
});
