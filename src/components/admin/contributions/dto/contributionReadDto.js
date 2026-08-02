import { centsToDecimalString, parseEuroCents } from "../core/money.js";
import {
  computeOutstandingCents,
  isContributionOverdue,
} from "../core/status.js";

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toAmountString(value) {
  const parsed = parseEuroCents(value, { allowZero: true });
  return parsed.ok ? parsed.decimal : centsToDecimalString(0);
}

function buildPlayerDisplayName(player = {}) {
  const firstName = normalizeText(player.first_name) || "";
  const lastName = normalizeText(player.last_name) || "";
  const displayName = `${firstName} ${lastName}`.trim();
  return displayName || "Spieler";
}

function buildPaymentSummary(payments = []) {
  const bookedPayments = (payments || [])
    .filter((payment) => payment?.status === "booked")
    .sort((a, b) => new Date(b?.paid_at || 0) - new Date(a?.paid_at || 0));

  return {
    paymentCount: bookedPayments.length,
    lastPaymentAt: bookedPayments[0]?.paid_at || null,
    lastPaymentAmount: bookedPayments[0]
      ? toAmountString(bookedPayments[0].amount)
      : centsToDecimalString(0),
  };
}

export function createContributionPaymentDto(payment = {}) {
  return {
    id: payment.id || null,
    contributionId: payment.contribution_id || null,
    amount: toAmountString(payment.amount),
    paidAt: payment.paid_at || null,
    paymentMethod: normalizeText(payment.payment_method),
    reference: normalizeText(payment.reference),
    status: payment.status || null,
    canceledAt: payment.canceled_at || null,
    cancellationReason: normalizeText(payment.cancellation_reason),
    createdAt: payment.created_at || null,
    updatedAt: payment.updated_at || null,
  };
}

export function createContributionReadDto(
  contribution = {},
  { player = null, season = null, payments = [] } = {},
) {
  const amountDue = toAmountString(contribution.amount_due);
  const amountPaid = toAmountString(contribution.amount_paid);
  const amountWaived = toAmountString(contribution.amount_waived);
  const amountDueCents = parseEuroCents(amountDue).cents;
  const amountPaidCents = parseEuroCents(amountPaid).cents;
  const amountWaivedCents = parseEuroCents(amountWaived).cents;
  const outstandingCents = computeOutstandingCents({
    amountDueCents,
    amountPaidCents,
    amountWaivedCents,
  });
  const paymentSummary = buildPaymentSummary(payments);

  return {
    id: contribution.id || null,
    playerId: contribution.player_id || player?.id || null,
    playerFirstName: player?.first_name || "",
    playerLastName: player?.last_name || "",
    playerDisplayName: buildPlayerDisplayName(player),
    seasonId: contribution.season_id || season?.id || null,
    seasonName: season?.name || "",
    contributionKey: contribution.contribution_key || null,
    title: contribution.title || "",
    amountDue,
    amountPaid,
    amountWaived,
    amountOutstanding: centsToDecimalString(outstandingCents),
    currency: contribution.currency || "EUR",
    status: contribution.status || null,
    dueDate: contribution.due_date || null,
    isOverdue: isContributionOverdue(
      { dueDate: contribution.due_date, outstandingCents, status: contribution.status },
      new Date(),
    ),
    deferredUntil: contribution.deferred_until || null,
    deferredReason: normalizeText(contribution.deferred_reason),
    installmentAgreement: Boolean(contribution.installment_agreement),
    installmentNotes: normalizeText(contribution.installment_notes),
    exemptionReason: normalizeText(contribution.exemption_reason),
    exemptedAt: contribution.exempted_at || null,
    canceledAt: contribution.canceled_at || null,
    cancellationReason: normalizeText(contribution.cancellation_reason),
    teamSnapshotName: normalizeText(contribution.team_snapshot_name),
    internalNotes: normalizeText(contribution.internal_notes),
    createdAt: contribution.created_at || null,
    updatedAt: contribution.updated_at || null,
    paymentCount: paymentSummary.paymentCount,
    lastPaymentAt: paymentSummary.lastPaymentAt,
    lastPaymentAmount: paymentSummary.lastPaymentAmount,
  };
}

export function createContributionDetailDto(
  contribution = {},
  { player = null, season = null, payments = [] } = {},
) {
  return {
    ...createContributionReadDto(contribution, { player, season, payments }),
    payments: (payments || []).map(createContributionPaymentDto),
    audit: {
      createdBy: contribution.created_by || null,
      updatedBy: contribution.updated_by || null,
      exemptedBy: contribution.exempted_by || null,
      canceledBy: contribution.canceled_by || null,
    },
  };
}
