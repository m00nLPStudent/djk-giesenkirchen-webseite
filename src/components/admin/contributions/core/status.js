import { CONTRIBUTION_STATUSES } from "./contributionConstants.js";

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function computeOutstandingCents({
  amountDueCents = 0,
  amountPaidCents = 0,
  amountWaivedCents = 0,
}) {
  return Math.max(0, amountDueCents - amountPaidCents - amountWaivedCents);
}

export function deriveContributionStatus({
  amountDueCents = 0,
  amountPaidCents = 0,
  amountWaivedCents = 0,
  deferredUntil = null,
  canceledAt = null,
}) {
  const outstandingCents = computeOutstandingCents({
    amountDueCents,
    amountPaidCents,
    amountWaivedCents,
  });

  if (canceledAt) return CONTRIBUTION_STATUSES[5];
  if (amountWaivedCents === amountDueCents && amountDueCents >= 0) {
    return CONTRIBUTION_STATUSES[4];
  }
  if (deferredUntil && outstandingCents > 0) return CONTRIBUTION_STATUSES[3];
  if (outstandingCents === 0 && amountPaidCents > 0) return CONTRIBUTION_STATUSES[2];
  if (amountPaidCents > 0) return CONTRIBUTION_STATUSES[1];
  return CONTRIBUTION_STATUSES[0];
}

export function isContributionOverdue(contribution = {}, now = new Date()) {
  const dueDate = toDateOnly(contribution?.due_date || contribution?.dueDate);
  const today = toDateOnly(now);
  const outstandingCents = contribution?.outstandingCents ?? 0;
  const status = contribution?.status || null;

  if (!dueDate || !today) return false;
  if (!outstandingCents) return false;
  if (status === "paid" || status === "exempt" || status === "canceled") {
    return false;
  }

  return dueDate.getTime() < today.getTime();
}

export function canEditContribution(contribution = {}) {
  return contribution?.status !== "canceled" && contribution?.status !== "exempt";
}

export function canRecordPayment(contribution = {}) {
  if (contribution?.status === "canceled" || contribution?.status === "exempt") {
    return false;
  }

  if (contribution?.status === "deferred") {
    return false;
  }

  return (contribution?.outstandingCents || 0) > 0;
}
