import { CURRENT_SEASON_STATUSES } from "../../persons/seasonalReadModelCore.mjs";
import { centsToDecimalString, parseEuroCents } from "../core/money.js";
import {
  computeOutstandingCents,
  deriveContributionStatus,
  isContributionOverdue,
} from "../core/status.js";
import { getContributionStatusLabel } from "./contributionFormatters.js";

function toCents(value) {
  return parseEuroCents(value, { allowZero: true }).cents;
}

function compareNullable(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return String(a).localeCompare(String(b));
}

function compareContributionRows(a = {}, b = {}) {
  const regularWeightA = a.contribution_key === "regular" ? 0 : 1;
  const regularWeightB = b.contribution_key === "regular" ? 0 : 1;

  return (
    regularWeightA - regularWeightB ||
    compareNullable(a.due_date, b.due_date) ||
    compareNullable(a.created_at, b.created_at) ||
    compareNullable(a.id, b.id)
  );
}

function createBaseStatus({
  playerId = null,
  contributionId = null,
  seasonId = null,
  status = "none",
  amountDue = "0.00",
  amountPaid = "0.00",
  amountOutstanding = "0.00",
  dueDate = null,
  isOverdue = false,
  hasContribution = false,
  warningCode = null,
} = {}) {
  return {
    playerId,
    contributionId,
    seasonId,
    status,
    displayStatus: getContributionStatusLabel(status),
    amountDue,
    amountPaid,
    amountOutstanding,
    dueDate,
    isOverdue,
    hasContribution,
    warningCode,
  };
}

function createStatusFromSingleContribution(row = {}, { warningCode = null } = {}) {
  const amountDueCents = toCents(row.amount_due);
  const amountPaidCents = toCents(row.amount_paid);
  const amountWaivedCents = toCents(row.amount_waived);
  const outstandingCents = computeOutstandingCents({
    amountDueCents,
    amountPaidCents,
    amountWaivedCents,
  });

  return createBaseStatus({
    playerId: row.player_id || null,
    contributionId: row.id || null,
    seasonId: row.season_id || null,
    status: row.status || "open",
    amountDue: centsToDecimalString(amountDueCents),
    amountPaid: centsToDecimalString(amountPaidCents),
    amountOutstanding: centsToDecimalString(outstandingCents),
    dueDate: row.due_date || null,
    isOverdue: isContributionOverdue(
      {
        dueDate: row.due_date,
        outstandingCents,
        status: row.status,
      },
      new Date(),
    ),
    hasContribution: true,
    warningCode,
  });
}

function createAggregatedStatus(rows = []) {
  const sortedRows = [...rows].sort(compareContributionRows);
  const amountDueCents = sortedRows.reduce(
    (sum, row) => sum + toCents(row.amount_due),
    0,
  );
  const amountPaidCents = sortedRows.reduce(
    (sum, row) => sum + toCents(row.amount_paid),
    0,
  );
  const amountWaivedCents = sortedRows.reduce(
    (sum, row) => sum + toCents(row.amount_waived),
    0,
  );
  const outstandingCents = computeOutstandingCents({
    amountDueCents,
    amountPaidCents,
    amountWaivedCents,
  });
  const dueDate = sortedRows
    .map((row) => row.due_date)
    .filter(Boolean)
    .sort()[0] || null;
  const hasDeferred = sortedRows.some(
    (row) => row.status === "deferred" || row.deferred_until,
  );
  const status = deriveContributionStatus({
    amountDueCents,
    amountPaidCents,
    amountWaivedCents,
    deferredUntil: hasDeferred ? dueDate || new Date().toISOString() : null,
    canceledAt: null,
  });
  const referenceRow = sortedRows[0] || {};

  return createBaseStatus({
    playerId: referenceRow.player_id || null,
    contributionId: sortedRows.length === 1 ? referenceRow.id || null : null,
    seasonId: referenceRow.season_id || null,
    status,
    amountDue: centsToDecimalString(amountDueCents),
    amountPaid: centsToDecimalString(amountPaidCents),
    amountOutstanding: centsToDecimalString(outstandingCents),
    dueDate,
    isOverdue: isContributionOverdue(
      { dueDate, outstandingCents, status },
      new Date(),
    ),
    hasContribution: true,
  });
}

export function createMissingContributionStatus(playerId = null, seasonId = null) {
  return createBaseStatus({
    playerId,
    seasonId,
    status: "none",
    hasContribution: false,
  });
}

export function createPlayerContributionStatusDto(
  playerId = null,
  seasonId = null,
  contributions = [],
) {
  const rows = [...(contributions || [])].sort(compareContributionRows);
  if (!rows.length) {
    return createMissingContributionStatus(playerId, seasonId);
  }

  const regularRows = rows.filter((row) => row.contribution_key === "regular");
  const activeRegularRows = regularRows.filter((row) => row.status !== "canceled");

  if (regularRows.length) {
    const target = (activeRegularRows[0] || regularRows[0]) ?? null;
    return createStatusFromSingleContribution(target, {
      warningCode: activeRegularRows.length > 1 ? "MULTIPLE_REGULAR" : null,
    });
  }

  const activeRows = rows.filter((row) => row.status !== "canceled");
  if (activeRows.length) {
    return activeRows.length === 1
      ? createStatusFromSingleContribution(activeRows[0])
      : createAggregatedStatus(activeRows);
  }

  return createStatusFromSingleContribution(rows[0]);
}

export function buildPlayerContributionStatusMap(
  playerIds = [],
  seasonId = null,
  contributionRows = [],
) {
  const rowsByPlayerId = new Map();

  (contributionRows || []).forEach((row) => {
    const list = rowsByPlayerId.get(row.player_id) || [];
    list.push(row);
    rowsByPlayerId.set(row.player_id, list);
  });

  return new Map(
    (playerIds || []).map((playerId) => [
      playerId,
      createPlayerContributionStatusDto(
        playerId,
        seasonId,
        rowsByPlayerId.get(playerId) || [],
      ),
    ]),
  );
}

export function createTeamContributionSummary(
  teamId = null,
  seasonId = null,
  playerIds = [],
  playerStatusMap = new Map(),
) {
  const summary = {
    teamId,
    seasonId,
    playerCount: (playerIds || []).length,
    contributionCount: 0,
    paidCount: 0,
    partiallyPaidCount: 0,
    openCount: 0,
    deferredCount: 0,
    exemptCount: 0,
    overdueCount: 0,
    missingContributionCount: 0,
    totalDue: "0.00",
    totalPaid: "0.00",
    totalOutstanding: "0.00",
  };

  let totalDueCents = 0;
  let totalPaidCents = 0;
  let totalOutstandingCents = 0;

  (playerIds || []).forEach((playerId) => {
    const status =
      playerStatusMap.get(playerId) ||
      createMissingContributionStatus(playerId, seasonId);

    if (!status.hasContribution) {
      summary.missingContributionCount += 1;
      return;
    }

    if (status.status !== "canceled") {
      summary.contributionCount += 1;
      totalDueCents += toCents(status.amountDue);
      totalPaidCents += toCents(status.amountPaid);
      totalOutstandingCents += toCents(status.amountOutstanding);
    }

    if (status.status === "paid") summary.paidCount += 1;
    if (status.status === "partially_paid") summary.partiallyPaidCount += 1;
    if (status.status === "open") summary.openCount += 1;
    if (status.status === "deferred") summary.deferredCount += 1;
    if (status.status === "exempt") summary.exemptCount += 1;
    if (status.isOverdue) summary.overdueCount += 1;
  });

  return {
    ...summary,
    totalDue: centsToDecimalString(totalDueCents),
    totalPaid: centsToDecimalString(totalPaidCents),
    totalOutstanding: centsToDecimalString(totalOutstandingCents),
  };
}

export function getContributionSeasonWarning(resolution = {}) {
  if (resolution?.activeSeasonStatus === CURRENT_SEASON_STATUSES.MISSING) {
    return "Es ist keine aktuelle Saison markiert. Beitragsstatus kann nicht angezeigt werden.";
  }

  if (resolution?.activeSeasonStatus === CURRENT_SEASON_STATUSES.AMBIGUOUS) {
    return "Es sind mehrere aktuelle Saisons markiert. Beitragsstatus bleibt bis zur Korrektur ausgeblendet.";
  }

  return "";
}
