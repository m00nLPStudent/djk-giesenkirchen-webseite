import "server-only";

import { supabase } from "@/lib/supabase";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import {
  buildPlayerAssignmentPayload,
  buildPlayerMasterPayload,
  buildPlayerMasterRollbackPayload,
  determinePlayerAssignmentOperation,
  PLAYER_ASSIGNMENT_OPERATIONS,
} from "./playerSeasonalWriteCore.mjs";
import { createPlayerAssignmentRollbackPlan } from "./playerWriteRollbackCore.mjs";
import {
  deletePlayerMaster,
  insertPlayerAssignment,
  insertPlayerMaster,
  loadPlayerCurrentSeasonAssignmentRows,
  loadPlayerMasterRecord,
  setPlayerAssignmentActive,
  updatePlayerAssignment,
  updatePlayerMaster,
} from "./playerWrite.repository";

function resolveClient(client = null) {
  return client || supabase;
}

function createServiceError(message, code = "PLAYER_SAVE_FAILED") {
  return { message, code };
}

function combineServiceErrors(primaryError, secondaryError) {
  if (!secondaryError) return primaryError;

  return createServiceError(
    `${primaryError.message} Rollback-Hinweis: ${secondaryError.message}`,
    primaryError.code,
  );
}

async function restorePlayerMaster(db, playerId, previousPlayer) {
  const restorePayload = buildPlayerMasterRollbackPayload(previousPlayer, {
    placeholderImage: PLAYER_PLACEHOLDER_IMAGE,
  });

  return await updatePlayerMaster(db, playerId, restorePayload);
}

async function applyAssignmentRollbackPlan(db, rollbackPlan = []) {
  let rollbackError = null;

  for (const step of rollbackPlan) {
    const error =
      step.type === "restore"
        ? await updatePlayerAssignment(db, step.assignmentId, step.payload)
        : await setPlayerAssignmentActive(db, step.assignmentId, step.isActive);

    if (error && !rollbackError) {
      rollbackError = error;
    }
  }

  return rollbackError;
}

function buildTargetAssignment(player, targetTeamSeasonOption) {
  return {
    teamSeasonId: targetTeamSeasonOption.teamSeasonId,
    shirtNumber: player?.shirt_number,
    positionDe: player?.position_de,
    positionEn: player?.position_en,
    isCaptain: player?.is_captain ?? false,
    sortOrder: player?.assignment_sort_order,
  };
}

async function applyEditAssignment(db, playerId, decision, assignmentPayload) {
  if (decision.operation === PLAYER_ASSIGNMENT_OPERATIONS.UNCHANGED) {
    return {
      error: null,
      updatedIds: [],
      reactivatedIds: [],
      insertedIds: [],
      deactivatedIds: [],
    };
  }

  if (decision.operation === PLAYER_ASSIGNMENT_OPERATIONS.UPDATE) {
    return {
      error: await updatePlayerAssignment(
        db,
        decision.currentAssignmentId,
        assignmentPayload,
      ),
      updatedIds: [decision.currentAssignmentId],
      reactivatedIds: [],
      insertedIds: [],
      deactivatedIds: [],
    };
  }

  if (decision.currentAssignmentId || decision.deactivateCurrentAssignmentId) {
    const assignmentId =
      decision.currentAssignmentId || decision.deactivateCurrentAssignmentId;
    const deactivateError = await setPlayerAssignmentActive(
      db,
      assignmentId,
      false,
    );

    if (deactivateError) {
      return {
        error: deactivateError,
        updatedIds: [],
        reactivatedIds: [],
        insertedIds: [],
        deactivatedIds: [],
      };
    }

    if (decision.operation === PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE) {
      const reactivateError = await updatePlayerAssignment(
        db,
        decision.targetAssignmentId,
        { ...assignmentPayload, is_active: true },
      );

      return {
        error: reactivateError,
        updatedIds: [],
        reactivatedIds: reactivateError ? [] : [decision.targetAssignmentId],
        insertedIds: [],
        deactivatedIds: [assignmentId],
      };
    }

    const insertResult = await insertPlayerAssignment(db, playerId, assignmentPayload);
    return {
      error: insertResult.error,
      updatedIds: [],
      reactivatedIds: [],
      insertedIds: insertResult.error ? [] : [insertResult.data?.id],
      deactivatedIds: [assignmentId],
    };
  }

  if (decision.operation === PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE) {
    const reactivateError = await updatePlayerAssignment(
      db,
      decision.targetAssignmentId,
      { ...assignmentPayload, is_active: true },
    );

    return {
      error: reactivateError,
      updatedIds: [],
      reactivatedIds: reactivateError ? [] : [decision.targetAssignmentId],
      insertedIds: [],
      deactivatedIds: [],
    };
  }

  const insertResult = await insertPlayerAssignment(db, playerId, assignmentPayload);
  return {
    error: insertResult.error,
    updatedIds: [],
    reactivatedIds: [],
    insertedIds: insertResult.error ? [] : [insertResult.data?.id],
    deactivatedIds: [],
  };
}

export async function savePlayer(
  player,
  id = null,
  { client = null, targetTeamSeasonOption = null } = {},
) {
  const db = resolveClient(client);

  if (!targetTeamSeasonOption?.teamSeasonId || !targetTeamSeasonOption?.seasonId) {
    return {
      data: null,
      error: createServiceError(
        "Es wurde keine gueltige Mannschaft der aktuellen Saison uebergeben.",
        "INVALID_TEAM_SEASON_TARGET",
      ),
    };
  }

  const masterPayload = buildPlayerMasterPayload(player, {
    placeholderImage: PLAYER_PLACEHOLDER_IMAGE,
  });
  const assignmentPayload = buildPlayerAssignmentPayload(
    player,
    targetTeamSeasonOption,
  );

  if (!id) {
    const playerResult = await insertPlayerMaster(db, masterPayload);
    if (playerResult.error) return playerResult;

    const assignmentResult = await insertPlayerAssignment(
      db,
      playerResult.data.id,
      assignmentPayload,
    );

    if (!assignmentResult.error) {
      return playerResult;
    }

    const rollbackError = await deletePlayerMaster(db, playerResult.data.id);
    return {
      data: null,
      error:
        rollbackError ||
        assignmentResult.error ||
        createServiceError("Die Saisonzuordnung konnte nicht erstellt werden."),
    };
  }

  const existingPlayerResult = await loadPlayerMasterRecord(db, id);
  if (existingPlayerResult.error) return existingPlayerResult;
  if (!existingPlayerResult.data) {
    return {
      data: null,
      error: createServiceError("Spieler nicht gefunden.", "PLAYER_NOT_FOUND"),
    };
  }

  const existingAssignmentsResult = await loadPlayerCurrentSeasonAssignmentRows(
    db,
    id,
    targetTeamSeasonOption.seasonId,
  );
  if (existingAssignmentsResult.error) {
    return { data: null, error: existingAssignmentsResult.error };
  }

  const assignmentDecision = determinePlayerAssignmentOperation(
    existingAssignmentsResult.data,
    buildTargetAssignment(player, targetTeamSeasonOption),
  );

  if (!assignmentDecision.ok) {
    return {
      data: null,
      error: createServiceError(
        assignmentDecision.message,
        assignmentDecision.code,
      ),
    };
  }

  const masterResult = await updatePlayerMaster(db, id, masterPayload);
  if (masterResult.error) return masterResult;

  const editAssignmentResult = await applyEditAssignment(
    db,
    id,
    assignmentDecision,
    assignmentPayload,
  );

  if (!editAssignmentResult.error) {
    return masterResult;
  }

  const assignmentRollbackError = await applyAssignmentRollbackPlan(
    db,
    createPlayerAssignmentRollbackPlan(
      existingAssignmentsResult.data,
      editAssignmentResult,
    ),
  );
  const rollbackResult = await restorePlayerMaster(
    db,
    id,
    existingPlayerResult.data,
  );

  return {
    data: null,
    error:
      combineServiceErrors(
        combineServiceErrors(editAssignmentResult.error, assignmentRollbackError),
        rollbackResult.error,
      ) ||
      editAssignmentResult.error ||
      createServiceError(
        "Die Saisonzuordnung konnte nicht gespeichert werden.",
      ),
  };
}
