import { deriveContributionStatus } from "../core/status.js";
import { parseEuroCents } from "../core/money.js";
import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants.js";
import { loadContributionById } from "../repositories/contributionsRead.repository.js";
import { loadContributionRecordById, updateContributionRecord } from "../repositories/contributionsWrite.repository.js";
import { buildContributionError, buildContributionSuccess } from "./actionResult.js";
import { logContributionFailure } from "./contributionLogging.service.js";
import { normalizeContributionInput } from "./contributionValidation.service.js";

async function loadContributionOrError(repository, db, contributionId) {
  const result = await repository.loadContributionRecordById(db, contributionId);
  if (result.error || !result.data) {
    return { ok: false, result: buildContributionError(CONTRIBUTION_ACTION_CODES.NOT_FOUND, "Der Beitrag wurde nicht gefunden.") };
  }
  return { ok: true, contribution: result.data };
}

async function updateAndReload(
  repository,
  db,
  contributionId,
  payload,
  actorProfileId,
  scope,
) {
  const updateResult = await repository.updateContributionRecord(
    db,
    contributionId,
    {
      ...payload,
      updated_by: actorProfileId,
    },
  );

  if (updateResult.error) {
    logContributionFailure(scope, updateResult.error, {
      actorProfileId,
      contributionId,
    });
    return buildContributionError(CONTRIBUTION_ACTION_CODES.DATABASE_ERROR, "Der Beitrag konnte nicht aktualisiert werden.");
  }

  const detail = await repository.loadContributionById(db, contributionId);
  return buildContributionSuccess("Beitrag wurde aktualisiert.", detail);
}

export async function deferContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = { loadContributionRecordById, updateContributionRecord, loadContributionById, ...deps };
  const normalized = normalizeContributionInput(input);
  const fieldErrors = {};

  if (!normalized.contributionId) fieldErrors.contributionId = "Beitrags-ID ist erforderlich.";
  if (!normalized.deferredUntil) fieldErrors.deferredUntil = "Stundungsdatum ist erforderlich.";
  if (!normalized.deferredReason) fieldErrors.deferredReason = "Begruendung ist erforderlich.";
  if (Object.keys(fieldErrors).length) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      fieldErrors,
    );
  }

  const loaded = await loadContributionOrError(
    repository,
    db,
    normalized.contributionId,
  );
  if (!loaded.ok) return loaded.result;

  const contribution = loaded.contribution;
  if (contribution.status === "canceled") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_CANCELED,
      "Stornierte Beitraege koennen nicht gestundet werden.",
    );
  }
  if (contribution.status === "exempt") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_EXEMPT,
      "Befreite Beitraege koennen nicht gestundet werden.",
    );
  }
  if (contribution.status === "paid") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_ALREADY_PAID,
      "Vollstaendig bezahlte Beitraege koennen nicht gestundet werden.",
    );
  }

  return updateAndReload(
    repository,
    db,
    normalized.contributionId,
    {
      status: "deferred",
      deferred_until: normalized.deferredUntil,
      deferred_reason: normalized.deferredReason,
      paid_at: null,
    },
    actorProfileId,
    "defer",
  );
}

export async function resumeContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = { loadContributionRecordById, updateContributionRecord, loadContributionById, ...deps };
  const normalized = normalizeContributionInput(input);
  if (!normalized.contributionId) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      { contributionId: "Beitrags-ID ist erforderlich." },
    );
  }

  const loaded = await loadContributionOrError(
    repository,
    db,
    normalized.contributionId,
  );
  if (!loaded.ok) return loaded.result;
  if (loaded.contribution.status !== "deferred") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Nur aktuell gestundete Beitraege koennen fortgesetzt werden.",
    );
  }

  const nextStatus = deriveContributionStatus({
    amountDueCents: parseEuroCents(loaded.contribution.amount_due).cents,
    amountPaidCents: parseEuroCents(loaded.contribution.amount_paid).cents,
    amountWaivedCents: parseEuroCents(loaded.contribution.amount_waived).cents,
  });

  return updateAndReload(
    repository,
    db,
    normalized.contributionId,
    {
      status: nextStatus,
      deferred_until: null,
      deferred_reason: null,
    },
    actorProfileId,
    "resume",
  );
}

export async function exemptContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = { loadContributionRecordById, updateContributionRecord, loadContributionById, ...deps };
  const normalized = normalizeContributionInput(input);
  const fieldErrors = {};

  if (!normalized.contributionId) fieldErrors.contributionId = "Beitrags-ID ist erforderlich.";
  if (!normalized.exemptionReason) fieldErrors.exemptionReason = "Befreiungsgrund ist erforderlich.";
  if (Object.keys(fieldErrors).length) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      fieldErrors,
    );
  }

  const loaded = await loadContributionOrError(
    repository,
    db,
    normalized.contributionId,
  );
  if (!loaded.ok) return loaded.result;

  const contribution = loaded.contribution;
  if (contribution.status === "canceled") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_CANCELED,
      "Stornierte Beitraege koennen nicht befreit werden.",
    );
  }
  if (parseEuroCents(contribution.amount_paid).cents > 0) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.PAYMENT_EXISTS,
      "Beitraege mit bestehenden Zahlungen koennen in diesem ersten Ausbaustand nicht befreit werden.",
    );
  }

  return updateAndReload(
    repository,
    db,
    normalized.contributionId,
    {
      status: "exempt",
      amount_waived: contribution.amount_due,
      exemption_reason: normalized.exemptionReason,
      exempted_at: new Date().toISOString(),
      exempted_by: actorProfileId,
      paid_at: null,
      deferred_until: null,
      deferred_reason: null,
    },
    actorProfileId,
    "exempt",
  );
}

export async function cancelContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = { loadContributionRecordById, updateContributionRecord, loadContributionById, ...deps };
  const normalized = normalizeContributionInput(input);
  const fieldErrors = {};

  if (!normalized.contributionId) fieldErrors.contributionId = "Beitrags-ID ist erforderlich.";
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

  const loaded = await loadContributionOrError(
    repository,
    db,
    normalized.contributionId,
  );
  if (!loaded.ok) return loaded.result;

  const contribution = loaded.contribution;
  if (contribution.status === "canceled") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_CANCELED,
      "Dieser Beitrag wurde bereits storniert.",
    );
  }
  if (parseEuroCents(contribution.amount_paid).cents > 0) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.PAYMENT_EXISTS,
      "Gebuchte Zahlungen muessen zuerst storniert werden, bevor der Beitrag storniert wird.",
    );
  }

  return updateAndReload(
    repository,
    db,
    normalized.contributionId,
    {
      status: "canceled",
      canceled_at: new Date().toISOString(),
      canceled_by: actorProfileId,
      cancellation_reason: normalized.cancellationReason,
      paid_at: null,
      deferred_until: null,
      deferred_reason: null,
    },
    actorProfileId,
    "cancel",
  );
}
