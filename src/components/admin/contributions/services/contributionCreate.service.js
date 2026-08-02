import { CONTRIBUTION_ACTION_CODES } from "../core/contributionConstants.js";
import { buildContributionError, buildContributionSuccess } from "./actionResult.js";
import { logContributionFailure } from "./contributionLogging.service.js";
import {
  findDuplicateContribution,
  insertContribution,
  loadPlayerRecordById,
  loadSeasonRecordById,
} from "../repositories/contributionsWrite.repository.js";
import { loadContributionById } from "../repositories/contributionsRead.repository.js";
import {
  normalizeContributionInput,
  validateContributionBaseInput,
  validateStatusNotClientControlled,
} from "./contributionValidation.service.js";

function mapDatabaseCreateError(error) {
  if (String(error?.code || "") === "23505") {
    return buildContributionError(
      CONTRIBUTION_ACTION_CODES.DUPLICATE_CONTRIBUTION,
      "Fuer diesen Spieler existiert bereits ein aktiver regulaerer Beitrag in der Saison.",
    );
  }

  return buildContributionError(
    CONTRIBUTION_ACTION_CODES.DATABASE_ERROR,
    "Der Beitrag konnte nicht gespeichert werden.",
  );
}

export async function createContribution(
  input,
  { db, actorProfileId },
  deps = {},
) {
  const repository = {
    loadPlayerRecordById,
    loadSeasonRecordById,
    findDuplicateContribution,
    insertContribution,
    loadContributionById,
    ...deps,
  };
  const normalized = normalizeContributionInput(input);
  const statusErrors = validateStatusNotClientControlled(normalized);
  const validation = validateContributionBaseInput(normalized);
  const fieldErrors = {
    ...validation.fieldErrors,
    ...statusErrors,
  };

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

  if (normalized.contributionKey === "regular") {
    const duplicateResult = await repository.findDuplicateContribution(db, {
      playerId: normalized.playerId,
      seasonId: normalized.seasonId,
      contributionKey: normalized.contributionKey,
    });

    if (duplicateResult.data) {
      return buildContributionError(
        CONTRIBUTION_ACTION_CODES.DUPLICATE_CONTRIBUTION,
        "Fuer diesen Spieler existiert bereits ein aktiver regulaerer Beitrag in der Saison.",
      );
    }
  }

  const insertResult = await repository.insertContribution(db, {
    player_id: normalized.playerId,
    season_id: normalized.seasonId,
    contribution_key: normalized.contributionKey,
    title: normalized.title,
    amount_due: validation.amountResult.decimal,
    amount_paid: "0.00",
    amount_waived: "0.00",
    currency: "EUR",
    status: "open",
    due_date: normalized.dueDate,
    installment_agreement: normalized.installmentAgreement,
    installment_notes: normalized.installmentNotes || null,
    internal_notes: normalized.internalNotes || null,
    team_snapshot_name: normalized.teamSnapshotName || null,
    created_by: actorProfileId,
    updated_by: actorProfileId,
  });

  if (insertResult.error || !insertResult.data?.id) {
    logContributionFailure("create", insertResult.error, { actorProfileId });
    return mapDatabaseCreateError(insertResult.error);
  }

  const detail = await repository.loadContributionById(db, insertResult.data.id);
  return buildContributionSuccess("Beitrag wurde angelegt.", detail);
}
