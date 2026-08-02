import {
  CONTRIBUTION_KEYS,
  CONTRIBUTION_STATUSES,
} from "../core/contributionConstants.js";
import { parseEuroCents } from "../core/money.js";

function normalizeText(value) {
  const trimmed = String(value || "").trim();
  return trimmed || null;
}

export function normalizeContributionInput(input = {}) {
  return {
    contributionId: normalizeText(input.contributionId || input.id),
    paymentId: normalizeText(input.paymentId || input.id),
    playerId: normalizeText(input.playerId),
    seasonId: normalizeText(input.seasonId),
    contributionKey: normalizeText(input.contributionKey),
    title: String(input.title || "").trim(),
    amountDue: input.amountDue,
    amount: input.amount,
    dueDate: normalizeText(input.dueDate),
    deferredUntil: normalizeText(input.deferredUntil),
    deferredReason: String(input.deferredReason || "").trim(),
    installmentAgreement: Boolean(input.installmentAgreement),
    installmentNotes: String(input.installmentNotes || "").trim(),
    exemptionReason: String(input.exemptionReason || "").trim(),
    cancellationReason: String(input.cancellationReason || "").trim(),
    paymentMethod: normalizeText(input.paymentMethod),
    reference: normalizeText(input.reference),
    internalNotes: String(input.internalNotes || "").trim(),
    paidAt: normalizeText(input.paidAt),
    status: normalizeText(input.status),
    teamSnapshotName: String(input.teamSnapshotName || "").trim(),
  };
}

export function validateContributionBaseInput(input = {}, { requireIdentity = true } = {}) {
  const fieldErrors = {};

  if (requireIdentity && !input.playerId) fieldErrors.playerId = "Spieler ist erforderlich.";
  if (requireIdentity && !input.seasonId) fieldErrors.seasonId = "Saison ist erforderlich.";
  if (!CONTRIBUTION_KEYS.includes(input.contributionKey)) {
    fieldErrors.contributionKey = "Unzulaessiger Beitragsschluessel.";
  }
  if (!input.title) fieldErrors.title = "Titel ist erforderlich.";
  if (!input.dueDate) fieldErrors.dueDate = "Faelligkeitsdatum ist erforderlich.";

  const amountResult = parseEuroCents(input.amountDue, { allowZero: false });
  if (!amountResult.ok) fieldErrors.amountDue = amountResult.message;

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    amountResult,
  };
}

export function validatePaymentInput(input = {}) {
  const fieldErrors = {};
  const amountResult = parseEuroCents(input.amount, { allowZero: false });
  if (!amountResult.ok) fieldErrors.amount = amountResult.message;
  if (!input.paidAt) fieldErrors.paidAt = "Zahlungsdatum ist erforderlich.";

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    amountResult,
  };
}

export function validateStatusNotClientControlled(input = {}) {
  if (!input.status) return {};
  if (CONTRIBUTION_STATUSES.includes(input.status)) {
    return {
      status: "Der Fachstatus darf nicht frei uebergeben werden.",
    };
  }

  return {};
}
