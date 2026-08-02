import { parseEuroCents } from "../core/money.js";
import { canRecordPayment } from "../core/status.js";
import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants.js";
import { loadContributionById } from "../repositories/contributionsRead.repository.js";
import {
  insertContributionPayment,
  loadContributionRecordById,
  loadPaymentRecordById,
  updateContributionPaymentRecord,
} from "../repositories/contributionsWrite.repository.js";
import { buildContributionError, buildContributionSuccess } from "./actionResult.js";
import { logContributionFailure } from "./contributionLogging.service.js";
import {
  normalizeContributionInput,
  validatePaymentInput,
} from "./contributionValidation.service.js";

export async function recordContributionPayment(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = {
    loadContributionRecordById,
    insertContributionPayment,
    loadContributionById,
    ...deps,
  };
  const normalized = normalizeContributionInput(input);
  const validation = validatePaymentInput(normalized);

  if (!normalized.contributionId) {
    validation.fieldErrors.contributionId = "Beitrags-ID ist erforderlich.";
  }

  if (!validation.ok || Object.keys(validation.fieldErrors).length) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      validation.fieldErrors,
    );
  }

  const contributionResult = await repository.loadContributionRecordById(
    db,
    normalized.contributionId,
  );

  if (contributionResult.error || !contributionResult.data) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.NOT_FOUND,
      "Der Beitrag wurde nicht gefunden.",
    );
  }

  const contribution = contributionResult.data;
  if (contribution.status === "canceled") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_CANCELED,
      "Auf stornierte Beitraege koennen keine Zahlungen gebucht werden.",
    );
  }

  if (contribution.status === "exempt") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_EXEMPT,
      "Auf befreite Beitraege koennen keine Zahlungen gebucht werden.",
    );
  }

  const outstandingCents = parseEuroCents(contribution.amount_outstanding).cents;
  if (!canRecordPayment({ ...contribution, outstandingCents })) {
    return buildContributionError(
      contribution.status === "paid"
        ? CONTRIBUTION_ACTION_CODES.CONTRIBUTION_ALREADY_PAID
        : CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      contribution.status === "deferred"
        ? "Gestundete Beitraege akzeptieren in diesem ersten Ausbaustand keine neuen Zahlungen."
        : "Auf diesen Beitrag kann keine weitere Zahlung gebucht werden.",
    );
  }

  if (validation.amountResult.cents > outstandingCents) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.PAYMENT_EXCEEDS_OUTSTANDING,
      "Die Zahlung uebersteigt den offenen Betrag.",
      { amount: "Zahlung uebersteigt den Restbetrag." },
    );
  }

  const insertResult = await repository.insertContributionPayment(db, {
    contribution_id: normalized.contributionId,
    amount: validation.amountResult.decimal,
    paid_at: normalized.paidAt,
    payment_method: normalized.paymentMethod,
    reference: normalized.reference,
    internal_notes: normalized.internalNotes || null,
    status: "booked",
    created_by: actorProfileId,
    updated_by: actorProfileId,
  });

  if (insertResult.error) {
    logContributionFailure("record_payment", insertResult.error, {
      actorProfileId,
      contributionId: normalized.contributionId,
    });
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.DATABASE_ERROR,
      "Die Zahlung konnte nicht gespeichert werden.",
    );
  }

  const detail = await repository.loadContributionById(db, normalized.contributionId);
  return buildContributionSuccess("Zahlung wurde erfasst.", detail);
}

export async function cancelContributionPayment(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = {
    loadPaymentRecordById,
    loadContributionById,
    updateContributionPaymentRecord,
    ...deps,
  };
  const normalized = normalizeContributionInput(input);
  const fieldErrors = {};

  if (!normalized.paymentId) fieldErrors.paymentId = "Payment-ID ist erforderlich.";
  if (!normalized.cancellationReason) {
    fieldErrors.cancellationReason = "Stornogrund ist erforderlich.";
  }

  if (Object.keys(fieldErrors).length) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      fieldErrors,
    );
  }

  const paymentResult = await repository.loadPaymentRecordById(db, normalized.paymentId);
  if (paymentResult.error || !paymentResult.data) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.NOT_FOUND,
      "Die Zahlung wurde nicht gefunden.",
    );
  }

  if (paymentResult.data.status === "canceled") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.PAYMENT_ALREADY_CANCELED,
      "Diese Zahlung wurde bereits storniert.",
    );
  }

  const updateResult = await repository.updateContributionPaymentRecord(
    db,
    normalized.paymentId,
    {
      status: "canceled",
      canceled_at: new Date().toISOString(),
      canceled_by: actorProfileId,
      cancellation_reason: normalized.cancellationReason,
      updated_by: actorProfileId,
    },
  );

  if (updateResult.error) {
    logContributionFailure("cancel_payment", updateResult.error, {
      actorProfileId,
      paymentId: normalized.paymentId,
    });
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.DATABASE_ERROR,
      "Die Zahlung konnte nicht storniert werden.",
    );
  }

  const detail = await repository.loadContributionById(
    db,
    paymentResult.data.contribution_id,
  );
  return buildContributionSuccess("Zahlung wurde storniert.", detail);
}
