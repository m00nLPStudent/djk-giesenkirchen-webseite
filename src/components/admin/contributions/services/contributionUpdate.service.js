import { parseEuroCents } from "../core/money.js";
import { canEditContribution, deriveContributionStatus } from "../core/status.js";
import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants.js";
import { loadContributionById } from "../repositories/contributionsRead.repository.js";
import {
  findDuplicateContribution,
  loadPlayerRecordById,
  loadContributionRecordById,
  loadSeasonRecordById,
  updateContributionRecord,
} from "../repositories/contributionsWrite.repository.js";
import { buildContributionError, buildContributionSuccess } from "./actionResult.js";
import { logContributionFailure } from "./contributionLogging.service.js";
import {
  normalizeContributionInput,
  validateContributionBaseInput,
  validateStatusNotClientControlled,
} from "./contributionValidation.service.js";

export async function updateContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = {
    loadPlayerRecordById,
    loadSeasonRecordById,
    findDuplicateContribution,
    loadContributionRecordById,
    updateContributionRecord,
    loadContributionById,
    ...deps,
  };
  const normalized = normalizeContributionInput(input);
  const validation = validateContributionBaseInput(normalized);
  const fieldErrors = {
    ...validation.fieldErrors,
    ...validateStatusNotClientControlled(normalized),
  };

  if (!normalized.contributionId) {
    fieldErrors.contributionId = "Beitrags-ID ist erforderlich.";
  }

  if (Object.keys(fieldErrors).length) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Bitte Eingaben pruefen.",
      fieldErrors,
    );
  }

  const [playerResult, seasonResult] = await Promise.all([
    repository.loadPlayerRecordById(db, normalized.playerId),
    repository.loadSeasonRecordById(db, normalized.seasonId),
  ]);

  if (playerResult.error || !playerResult.data) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.NOT_FOUND,
      "Der Spieler wurde nicht gefunden.",
      { playerId: "Spieler nicht gefunden." },
    );
  }

  if (seasonResult.error || !seasonResult.data) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.NOT_FOUND,
      "Die Saison wurde nicht gefunden.",
      { seasonId: "Saison nicht gefunden." },
    );
  }

  const existingResult = await repository.loadContributionRecordById(
    db,
    normalized.contributionId,
  );

  if (existingResult.error || !existingResult.data) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.NOT_FOUND,
      "Der Beitrag wurde nicht gefunden.",
    );
  }

  if (normalized.contributionKey === "regular") {
    const duplicateResult = await repository.findDuplicateContribution(db, {
      playerId: normalized.playerId,
      seasonId: normalized.seasonId,
      contributionKey: normalized.contributionKey,
      excludeId: normalized.contributionId,
    });

    if (duplicateResult.data) {
      return buildContributionError(
        CONTRIBUTION_ACTION_CODES.DUPLICATE_CONTRIBUTION,
        "Fuer diesen Spieler existiert bereits ein aktiver regulaerer Beitrag in der Saison.",
      );
    }
  }

  const existing = existingResult.data;
  if (!canEditContribution(existing)) {
    return buildContributionError(
      existing.status === "canceled"
        ? CONTRIBUTION_ACTION_CODES.CONTRIBUTION_CANCELED
        : CONTRIBUTION_ACTION_CODES.CONTRIBUTION_EXEMPT,
      existing.status === "canceled"
        ? "Stornierte Beitraege koennen nicht bearbeitet werden."
        : "Befreite Beitraege koennen nur ueber die Befreiungsaktion geaendert werden.",
    );
  }

  const paidPlusWaivedCents =
    parseEuroCents(existing.amount_paid).cents +
    parseEuroCents(existing.amount_waived).cents;

  if (validation.amountResult.cents < paidPlusWaivedCents) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.VALIDATION_ERROR,
      "Der Sollbetrag darf nicht unter die bereits gebuchte Summe fallen.",
      { amountDue: "Sollbetrag liegt unter bezahlt plus erlassen." },
    );
  }

  if (
    existing.status === "paid" &&
    validation.amountResult.decimal !== parseEuroCents(existing.amount_due).decimal
  ) {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.CONTRIBUTION_ALREADY_PAID,
      "Vollstaendig bezahlte Beitraege werden in diesem Ausbaustand nicht ueber den Sollbetrag wieder geoeffnet.",
    );
  }

  const nextStatus = deriveContributionStatus({
    amountDueCents: validation.amountResult.cents,
    amountPaidCents: parseEuroCents(existing.amount_paid).cents,
    amountWaivedCents: parseEuroCents(existing.amount_waived).cents,
    deferredUntil: existing.deferred_until,
    canceledAt: existing.canceled_at,
  });

  const updateResult = await repository.updateContributionRecord(
    db,
    normalized.contributionId,
    {
      player_id: normalized.playerId,
      season_id: normalized.seasonId,
      contribution_key: normalized.contributionKey,
      title: normalized.title,
      amount_due: validation.amountResult.decimal,
      due_date: normalized.dueDate,
      installment_agreement: normalized.installmentAgreement,
      installment_notes: normalized.installmentNotes || null,
      internal_notes: normalized.internalNotes || null,
      team_snapshot_name: normalized.teamSnapshotName || null,
      status: nextStatus,
      updated_by: actorProfileId,
    },
  );

  if (updateResult.error) {
    logContributionFailure("update", updateResult.error, {
      actorProfileId,
      contributionId: normalized.contributionId,
    });
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.DATABASE_ERROR,
      "Der Beitrag konnte nicht aktualisiert werden.",
    );
  }

  const detail = await repository.loadContributionById(db, normalized.contributionId);
  return buildContributionSuccess("Beitrag wurde aktualisiert.", detail);
}
