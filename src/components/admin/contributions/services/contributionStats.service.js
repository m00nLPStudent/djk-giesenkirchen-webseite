import {
  addCents,
  centsToDecimalString,
  parseEuroCents,
} from "../core/money.js";
import { loadFilteredContributions } from "../repositories/contributionsRead.repository.js";
import { createEmptyContributionStats } from "./contributionStats.defaults.js";

async function loadCurrentSeasonResolutionDefault(db) {
  const seasonRepository = await import("../../persons/currentSeasonRepository.js");
  return seasonRepository.loadCurrentSeasonResolution(db);
}

function countByStatus(contributions = [], status) {
  return (contributions || []).filter((item) => item.status === status).length;
}

function toMoneyCents(value) {
  const parsed = parseEuroCents(value, { allowZero: true });
  return parsed.ok ? parsed.cents : 0;
}

function normalizeContributionList(contributions = []) {
  return Array.isArray(contributions) ? contributions.filter(Boolean) : [];
}

export async function loadContributionStats(db, filters = {}, deps = {}) {
  const repository = {
    loadFilteredContributions,
    loadCurrentSeasonResolution: loadCurrentSeasonResolutionDefault,
    ...deps,
  };
  const contributions = normalizeContributionList(
    await repository.loadFilteredContributions(db, filters),
  );
  const seasonResolution = await repository.loadCurrentSeasonResolution(db);
  const currentSeasonId = filters.seasonId || seasonResolution.activeSeasonId || null;
  const currentSeasonContributions = currentSeasonId
    ? contributions.filter((item) => item.seasonId === currentSeasonId)
    : [];
  const activeContributions = contributions.filter(
    (item) => item.status !== "canceled",
  );

  const totalDue = addCents(
    activeContributions.map((item) => toMoneyCents(item.amountDue)),
  );
  const totalPaid = addCents(
    activeContributions.map((item) => toMoneyCents(item.amountPaid)),
  );
  const totalWaived = addCents(
    activeContributions.map((item) => toMoneyCents(item.amountWaived)),
  );
  const totalOutstanding = addCents(
    activeContributions.map((item) => toMoneyCents(item.amountOutstanding)),
  );
  const paymentsCurrentSeason = addCents(
    currentSeasonContributions.map((item) => toMoneyCents(item.amountPaid)),
  );

  return {
    ...createEmptyContributionStats(),
    totalCount: contributions.length,
    openCount: countByStatus(contributions, "open"),
    partiallyPaidCount: countByStatus(contributions, "partially_paid"),
    paidCount: countByStatus(contributions, "paid"),
    deferredCount: countByStatus(contributions, "deferred"),
    exemptCount: countByStatus(contributions, "exempt"),
    canceledCount: countByStatus(contributions, "canceled"),
    overdueCount: contributions.filter((item) => item.isOverdue).length,
    totalDue: centsToDecimalString(totalDue),
    totalPaid: centsToDecimalString(totalPaid),
    totalWaived: centsToDecimalString(totalWaived),
    totalOutstanding: centsToDecimalString(totalOutstanding),
    paymentsCurrentSeason: centsToDecimalString(paymentsCurrentSeason),
  };
}
