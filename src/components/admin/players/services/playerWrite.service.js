import "server-only";

import { supabase } from "@/lib/supabase";
import { PLAYER_PLACEHOLDER_IMAGE } from "@/constants/images";
import {
  buildPlayerAssignmentPayload,
  buildPlayerMasterPayload,
  buildPlayerMasterRollbackPayload,
  createMultiPlayerAssignmentSyncPlan,
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
  if (!targetTeamSeasonOption) return null;
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

    if (decision.operation === PLAYER_ASSIGNMENT_OPERATIONS.DEACTIVATE) {
      return {
        error: null,
        updatedIds: [],
        reactivatedIds: [],
        insertedIds: [],
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

async function applyMultiEditAssignments(
  db,
  playerId,
  syncPlan,
  targetOptionsById,
  player,
) {
  const result = {
    error: null,
    updatedIds: [],
    reactivatedIds: [],
    insertedIds: [],
    deactivatedIds: [],
    insertedIdByTeamSeasonId: new Map(),
  };

  for (const assignment of syncPlan.deactivatedAssignments) {
    const error = await setPlayerAssignmentActive(
      db,
      assignment.playerTeamSeasonId,
      false,
    );
    if (error) return { ...result, error };
    result.deactivatedIds.push(assignment.playerTeamSeasonId);
  }

  for (const assignment of syncPlan.reactivatedAssignments) {
    const error = await setPlayerAssignmentActive(
      db,
      assignment.playerTeamSeasonId,
      true,
    );
    if (error) return { ...result, error };
    result.reactivatedIds.push(assignment.playerTeamSeasonId);
  }

  for (const teamSeasonId of syncPlan.addedTeamSeasonIds) {
    const option = targetOptionsById.get(teamSeasonId);
    if (!option) {
      return {
        ...result,
        error: createServiceError(
          "Eine Zielmannschaft konnte nicht eindeutig aufgelöst werden.",
          "INVALID_MULTI_TEAM_TARGET",
        ),
      };
    }
    const insertResult = await insertPlayerAssignment(
      db,
      playerId,
      buildPlayerAssignmentPayload(player, option),
    );
    if (insertResult.error) return { ...result, error: insertResult.error };
    const insertedId = insertResult.data?.id;
    if (insertedId) {
      result.insertedIds.push(insertedId);
      result.insertedIdByTeamSeasonId.set(teamSeasonId, insertedId);
    }
  }

  return result;
}

function buildMultiAssignmentChange(
  existingAssignments,
  desiredOptions,
  editResult = {},
) {
  const existingByTeamSeasonId = new Map(
    (existingAssignments || []).map((assignment) => [
      assignment.teamSeasonId,
      assignment,
    ]),
  );
  const insertedIdByTeamSeasonId = editResult.insertedIdByTeamSeasonId || new Map();

  return {
    operation: "SYNC_MULTI_ASSIGNMENTS",
    previousAssignments: (existingAssignments || []).filter(
      (assignment) => assignment.isActive !== false,
    ),
    nextAssignments: (desiredOptions || []).map((option) => {
      const existing = existingByTeamSeasonId.get(option.teamSeasonId);
      return {
        ...option,
        playerTeamSeasonId:
          existing?.playerTeamSeasonId ||
          insertedIdByTeamSeasonId.get(option.teamSeasonId) ||
          null,
        isActive: true,
      };
    }),
  };
}

export async function savePlayer(
  player,
  id = null,
  {
    client = null,
    targetTeamSeasonOption = null,
    targetTeamSeasonOptions = [],
    allowMultipleAssignments = false,
    activeSeasonId = null,
  } = {},
) {
  const db = resolveClient(client);

  const desiredTeamSeasonOptions = allowMultipleAssignments
    ? targetTeamSeasonOptions
    : [targetTeamSeasonOption].filter(Boolean);

  if (desiredTeamSeasonOptions.some((option) => !option?.teamSeasonId || !option?.seasonId)) {
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
  const assignmentPayload = targetTeamSeasonOption
    ? buildPlayerAssignmentPayload(player, targetTeamSeasonOption)
    : null;

  if (!id) {
    const playerResult = await insertPlayerMaster(db, masterPayload);
    if (playerResult.error) return playerResult;

    if (!desiredTeamSeasonOptions.length) {
      return { ...playerResult, assignmentChange: null };
    }

    if (allowMultipleAssignments) {
      const insertedIdByTeamSeasonId = new Map();
      for (const option of desiredTeamSeasonOptions) {
        const assignmentResult = await insertPlayerAssignment(
          db,
          playerResult.data.id,
          buildPlayerAssignmentPayload(player, option),
        );
        if (assignmentResult.error) {
          const rollbackError = await deletePlayerMaster(db, playerResult.data.id);
          return { data: null, error: rollbackError || assignmentResult.error };
        }
        insertedIdByTeamSeasonId.set(
          option.teamSeasonId,
          assignmentResult.data?.id || null,
        );
      }
      return {
        ...playerResult,
        assignmentChange: buildMultiAssignmentChange(
          [],
          desiredTeamSeasonOptions,
          { insertedIdByTeamSeasonId },
        ),
      };
    }

    const assignmentResult = await insertPlayerAssignment(
      db,
      playerResult.data.id,
      assignmentPayload,
    );

    if (!assignmentResult.error) {
      return { ...playerResult, assignmentChange: { operation: PLAYER_ASSIGNMENT_OPERATIONS.CREATE,
        previousAssignment: null, targetAssignment: targetTeamSeasonOption, assignmentId: assignmentResult.data?.id || null } };
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

  const assignmentSeasonId = desiredTeamSeasonOptions[0]?.seasonId || activeSeasonId;
  if (!assignmentSeasonId) {
    return { ...(await updatePlayerMaster(db, id, masterPayload)), assignmentChange: null };
  }
  const existingAssignmentsResult = await loadPlayerCurrentSeasonAssignmentRows(db, id, assignmentSeasonId);
  if (existingAssignmentsResult.error) {
    return { data: null, error: existingAssignmentsResult.error };
  }

  if (allowMultipleAssignments) {
    const syncPlan = createMultiPlayerAssignmentSyncPlan(
      existingAssignmentsResult.data,
      desiredTeamSeasonOptions.map((option) => option.teamSeasonId),
    );
    if (!syncPlan.ok) {
      return {
        data: null,
        error: createServiceError(syncPlan.message, syncPlan.code),
      };
    }

    const masterResult = await updatePlayerMaster(db, id, masterPayload);
    if (masterResult.error) return masterResult;

    const editAssignmentResult = await applyMultiEditAssignments(
      db,
      id,
      syncPlan,
      new Map(
        desiredTeamSeasonOptions.map((option) => [option.teamSeasonId, option]),
      ),
      player,
    );

    if (!editAssignmentResult.error) {
      return {
        ...masterResult,
        assignmentChange: buildMultiAssignmentChange(
          existingAssignmentsResult.data,
          desiredTeamSeasonOptions,
          editAssignmentResult,
        ),
      };
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
        ) || editAssignmentResult.error,
    };
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
    const previousAssignment = existingAssignmentsResult.data.find(
      (assignment) => assignment.isActive !== false,
    ) || null;
    const assignmentId = editAssignmentResult.insertedIds[0] || editAssignmentResult.reactivatedIds[0] || editAssignmentResult.updatedIds[0] || assignmentDecision.currentAssignmentId || null;
    return { ...masterResult, assignmentChange: { operation: assignmentDecision.operation,
      previousAssignment, targetAssignment: targetTeamSeasonOption, assignmentId } };
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
