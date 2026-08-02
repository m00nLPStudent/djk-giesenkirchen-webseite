export const EMPTY_CONTRIBUTION_STATS = Object.freeze({
  totalCount: 0,
  openCount: 0,
  partiallyPaidCount: 0,
  paidCount: 0,
  deferredCount: 0,
  exemptCount: 0,
  canceledCount: 0,
  overdueCount: 0,
  totalDue: "0.00",
  totalPaid: "0.00",
  totalWaived: "0.00",
  totalOutstanding: "0.00",
  paymentsCurrentSeason: "0.00",
});

export function createEmptyContributionStats() {
  return { ...EMPTY_CONTRIBUTION_STATS };
}
