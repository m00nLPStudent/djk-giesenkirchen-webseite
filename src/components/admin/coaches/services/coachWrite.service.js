import "server-only";

import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { supabase } from "@/lib/supabase";
import {
  buildCoachAssignmentPayload,
  buildCoachMasterPayload,
  buildCoachMasterRollbackPayload,
  determineCoachAssignmentOperations,
  normalizeCoachAssignments,
} from "./coachSeasonalWriteCore.mjs";
import { createCoachAssignmentRollbackPlan } from "./coachWriteRollbackCore.mjs";
import {
  deleteCoachMaster,
  insertCoachAssignment,
  insertCoachMaster,
  loadCoachCurrentSeasonAssignmentRows,
  loadCoachMasterRecord,
  setCoachAssignmentActive,
  updateCoachAssignment,
  updateCoachMaster,
} from "./coachWrite.repository";

function resolveClient(client = null) {
  return client || supabase;
}

function createServiceError(message, code = "COACH_SAVE_FAILED") {
  return { message, code };
}

function combineServiceErrors(primaryError, secondaryError) {
  if (!secondaryError) return primaryError;

  return createServiceError(
    `${primaryError.message} Rollback-Hinweis: ${secondaryError.message}`,
    primaryError.code,
  );
}

async function restoreCoachMaster(db, coachId, previousCoach) {
  const restorePayload = buildCoachMasterRollbackPayload(previousCoach, {
    placeholderImage: COACH_PLACEHOLDER_IMAGE,
  });

  return await updateCoachMaster(db, coachId, restorePayload);
}

async function applyAssignmentRollbackPlan(db, rollbackPlan = []) {
  let rollbackError = null;

  for (const step of rollbackPlan) {
    const error =
      step.type === "restore"
        ? await updateCoachAssignment(db, step.assignmentId, step.payload)
        : await setCoachAssignmentActive(db, step.assignmentId, step.isActive);

    if (error && !rollbackError) {
      rollbackError = error;
    }
  }

  return rollbackError;
}

function buildMasterSavePayload(coach, existingCoach = null, primaryAssignment = null) {
  return buildCoachMasterPayload(
    existingCoach ? { ...existingCoach, ...coach } : coach,
    {
      primaryAssignment,
      placeholderImage: COACH_PLACEHOLDER_IMAGE,
    },
  );
}

async function applyCreateAssignments(db, coachId, normalizedAssignments, optionById) {
  const insertedAssignmentIds = [];

  for (const assignment of normalizedAssignments) {
    const assignmentResult = await insertCoachAssignment(
      db,
      coachId,
      buildCoachAssignmentPayload(
        assignment,
        optionById.get(assignment.teamSeasonId),
      ),
    );
    if (assignmentResult.error) {
      return { error: assignmentResult.error, insertedAssignmentIds };
    }
    insertedAssignmentIds.push(assignmentResult.data?.id);
  }

  return { error: null, insertedAssignmentIds };
}

async function applyEditAssignments(db, operations, optionById) {
  const updatedIds = [];
  const reactivatedIds = [];
  const insertedIds = [];
  const deactivatedIds = [];

  for (const assignmentId of operations.deactivateIds) {
    const error = await setCoachAssignmentActive(db, assignmentId, false);
    if (error) {
      return { error, updatedIds, reactivatedIds, insertedIds, deactivatedIds };
    }
    deactivatedIds.push(assignmentId);
  }

  for (const assignment of operations.updates) {
    const error = await updateCoachAssignment(
      db,
      assignment.coachTeamSeasonId,
      buildCoachAssignmentPayload(
        assignment,
        optionById.get(assignment.teamSeasonId),
      ),
    );
    if (error) {
      return { error, updatedIds, reactivatedIds, insertedIds, deactivatedIds };
    }
    updatedIds.push(assignment.coachTeamSeasonId);
  }

  for (const assignment of operations.reactivations) {
    const error = await updateCoachAssignment(
      db,
      assignment.coachTeamSeasonId,
      {
        ...buildCoachAssignmentPayload(
          assignment,
          optionById.get(assignment.teamSeasonId),
        ),
        is_active: true,
      },
    );
    if (error) {
      return { error, updatedIds, reactivatedIds, insertedIds, deactivatedIds };
    }
    reactivatedIds.push(assignment.coachTeamSeasonId);
  }

  for (const assignment of operations.inserts) {
    const insertResult = await insertCoachAssignment(
      db,
      assignment.coachId,
      buildCoachAssignmentPayload(
        assignment,
        optionById.get(assignment.teamSeasonId),
      ),
    );
    if (insertResult.error) {
      return {
        error: insertResult.error,
        updatedIds,
        reactivatedIds,
        insertedIds,
        deactivatedIds,
      };
    }
    insertedIds.push(insertResult.data?.id);
  }

  return { error: null, updatedIds, reactivatedIds, insertedIds, deactivatedIds };
}

async function rollbackEditAssignments(
  db,
  existingAssignments = [],
  editAssignmentsResult,
) {
  return await applyAssignmentRollbackPlan(
    db,
    createCoachAssignmentRollbackPlan(existingAssignments, editAssignmentsResult),
  );
}

export async function saveCoach(
  coach,
  id = null,
  { client = null, teamSeasonOptions = [] } = {},
) {
  const db = resolveClient(client);
  const normalizedAssignments = normalizeCoachAssignments(
    coach?.assignments || [],
    teamSeasonOptions,
  );
  const primaryAssignment = normalizedAssignments[0] || null;
  const optionById = new Map(
    (teamSeasonOptions || []).map((option) => [option.teamSeasonId, option]),
  );

  if (!id) {
    const masterPayload = buildMasterSavePayload(coach, null, primaryAssignment);
    const coachResult = await insertCoachMaster(db, masterPayload);
    if (coachResult.error) return coachResult;

    const createAssignmentsResult = await applyCreateAssignments(
      db,
      coachResult.data.id,
      normalizedAssignments,
      optionById,
    );

    if (!createAssignmentsResult.error) {
      return coachResult;
    }

    const rollbackError = await deleteCoachMaster(db, coachResult.data.id);

    return {
      data: null,
      error:
        rollbackError ||
        createAssignmentsResult.error ||
        createServiceError(
          "Die Trainer-Saisonzuordnungen konnten nicht gespeichert werden.",
        ),
    };
  }

  const existingCoachResult = await loadCoachMasterRecord(db, id);
  if (existingCoachResult.error) return existingCoachResult;
  if (!existingCoachResult.data) {
    return {
      data: null,
      error: createServiceError("Trainer nicht gefunden.", "COACH_NOT_FOUND"),
    };
  }

  const existingAssignmentsResult = await loadCoachCurrentSeasonAssignmentRows(
    db,
    id,
  );
  if (existingAssignmentsResult.error) {
    return { data: null, error: existingAssignmentsResult.error };
  }
  const assignmentOperations = determineCoachAssignmentOperations(
    { assignments: existingAssignmentsResult.data },
    normalizedAssignments,
  );

  if (!assignmentOperations.ok) {
    return {
      data: null,
      error: createServiceError(
        assignmentOperations.message,
        assignmentOperations.code,
      ),
    };
  }

  const masterPayload = buildMasterSavePayload(
    coach,
    existingCoachResult.data,
    primaryAssignment,
  );
  const masterResult = await updateCoachMaster(db, id, masterPayload);
  if (masterResult.error) return masterResult;

  const editAssignmentsResult = await applyEditAssignments(
    db,
    {
      ...assignmentOperations,
      inserts: assignmentOperations.inserts.map((assignment) => ({
        ...assignment,
        coachId: id,
      })),
    },
    optionById,
  );

  if (!editAssignmentsResult.error) {
    return masterResult;
  }

  const assignmentRollbackError = await rollbackEditAssignments(
    db,
    existingAssignmentsResult.data,
    editAssignmentsResult,
  );
  const rollbackResult = await restoreCoachMaster(db, id, existingCoachResult.data);

  return {
    data: null,
    error:
      combineServiceErrors(
        combineServiceErrors(editAssignmentsResult.error, assignmentRollbackError),
        rollbackResult.error,
      ) ||
      editAssignmentsResult.error ||
      createServiceError(
        "Die Trainer-Saisonzuordnungen konnten nicht gespeichert werden.",
      ),
  };
}
