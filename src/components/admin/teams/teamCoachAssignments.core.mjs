import {
  getCoachAssignmentRoleLabels,
  getCoachLegacyRoleLabels,
} from "@/components/admin/persons/coachRoleSummary.mjs";

const COACH_ROLE_EN = {
  Trainer: "Coach",
  "Co-Trainer": "Assistant Coach",
  Betreuer: "Supervisor",
  Torwarttrainer: "Goalkeeper Coach",
  Cheftrainer: "Head Coach",
};

function compareNullable(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareAssignments(a, b) {
  return (
    compareNullable(a.sort_order, b.sort_order) ||
    compareNullable(a.created_at, b.created_at) ||
    compareNullable(a.id, b.id)
  );
}

function getPreferredCurrentSeasonAssignment(assignments = []) {
  return [...(assignments || [])].sort(compareAssignments)[0] || null;
}

function toRoleEn(roleDe) {
  return COACH_ROLE_EN[String(roleDe || "").trim()] || null;
}

function getCoachFallbackRolePayload(coach = {}) {
  const legacyRoleLabels = getCoachLegacyRoleLabels(coach);
  const fallbackRoleDe = legacyRoleLabels[0] || "Trainer";
  return {
    role_de: fallbackRoleDe,
    role_en: toRoleEn(fallbackRoleDe),
    legacyRoleLabels,
  };
}

export function buildTeamCoachSelectionState({
  coaches = [],
  coachAssignments = [],
  currentSeasonCoachAssignments = [],
  teamSeasonId = null,
}) {
  const assignmentsByCoachId = new Map();
  const currentSeasonAssignmentsByCoachId = new Map();

  for (const assignment of coachAssignments || []) {
    if (!assignment?.coach_id || assignment?.team_season_id !== teamSeasonId) {
      continue;
    }

    const current = assignmentsByCoachId.get(assignment.coach_id) || [];
    current.push(assignment);
    assignmentsByCoachId.set(assignment.coach_id, current);
  }

  for (const assignment of currentSeasonCoachAssignments || []) {
    if (!assignment?.coach_id || assignment?.is_active === false) continue;
    const current =
      currentSeasonAssignmentsByCoachId.get(assignment.coach_id) || [];
    current.push(assignment);
    currentSeasonAssignmentsByCoachId.set(assignment.coach_id, current);
  }

  return (coaches || []).map((coach) => {
    const teamAssignments = (assignmentsByCoachId.get(coach.id) || []).sort(
      compareAssignments,
    );
    const currentAssignments = teamAssignments.filter(
      (assignment) => assignment?.is_active !== false,
    );
    const primaryAssignment = currentAssignments[0] || null;
    const inactiveCurrentAssignments = teamAssignments.filter(
      (assignment) => assignment?.is_active === false,
    );
    const seasonAssignments =
      currentSeasonAssignmentsByCoachId.get(coach.id) || [];
    const otherAssignments = seasonAssignments.filter(
      (assignment) => assignment.team_season_id !== teamSeasonId,
    );
    const currentRoleLabels = getCoachAssignmentRoleLabels(currentAssignments);
    const reactivationRoleLabels = getCoachAssignmentRoleLabels(
      inactiveCurrentAssignments,
    );
    const legacyRoleLabels =
      currentRoleLabels.length === 0 && reactivationRoleLabels.length === 0
        ? getCoachLegacyRoleLabels(coach)
        : [];

    return {
      ...coach,
      coach_id: coach.id,
      coach_team_season_id: primaryAssignment?.id || null,
      team_season_id: teamSeasonId || null,
      role_de: primaryAssignment?.role_de || null,
      role_en: primaryAssignment?.role_en || null,
      sort_order: primaryAssignment?.sort_order ?? coach.sort_order ?? 0,
      is_active: primaryAssignment ? primaryAssignment.is_active !== false : false,
      isAssignedToCurrentTeam: currentAssignments.length > 0,
      currentAssignmentCount: currentAssignments.length,
      currentRoleLabels,
      reactivationRoleLabels,
      legacyRoleLabels,
      currentRoleSource:
        currentRoleLabels.length > 0
          ? "active_assignment"
          : reactivationRoleLabels.length > 0
            ? "inactive_assignment"
            : legacyRoleLabels.length > 0
              ? "legacy_fallback"
              : "none",
      legacyRoleFallbackUsed:
        currentRoleLabels.length === 0 &&
        reactivationRoleLabels.length === 0 &&
        legacyRoleLabels.length > 0,
      hasOtherActiveAssignments: otherAssignments.length > 0,
      otherActiveAssignmentCount: otherAssignments.length,
    };
  });
}

export function planTeamCoachAssignmentSync({
  existingAssignments = [],
  selectedCoachIds = [],
  coachesById = new Map(),
  currentSeasonAssignmentsByCoachId = new Map(),
  teamSeasonId = null,
}) {
  const selectedIds = new Set((selectedCoachIds || []).filter(Boolean));
  const assignmentsByCoachId = new Map();

  for (const assignment of existingAssignments || []) {
    if (!assignment?.coach_id) continue;
    const current = assignmentsByCoachId.get(assignment.coach_id) || [];
    current.push(assignment);
    assignmentsByCoachId.set(assignment.coach_id, current);
  }

  const reactivateIds = [];
  const deactivateIds = [];
  const createRows = [];

  for (const [coachId, rows] of assignmentsByCoachId.entries()) {
    const activeRows = rows
      .filter((row) => row?.is_active !== false)
      .sort(compareAssignments);

    if (!selectedIds.has(coachId)) {
      deactivateIds.push(...activeRows.map((row) => row.id).filter(Boolean));
      continue;
    }

    if (activeRows.length > 0) {
      continue;
    }

    const inactiveRows = rows
      .filter((row) => row?.is_active === false)
      .sort(compareAssignments);

    if (inactiveRows.length > 0) {
      if (inactiveRows[0]?.id) {
        reactivateIds.push(inactiveRows[0].id);
      }
      continue;
    }

    const coach = coachesById.get(coachId) || {};
    const preferredAssignment = getPreferredCurrentSeasonAssignment(
      currentSeasonAssignmentsByCoachId.get(coachId) || [],
    );
    const fallbackRolePayload = getCoachFallbackRolePayload(coach);
    createRows.push({
      coach_id: coachId,
      team_season_id: teamSeasonId,
      role_de: preferredAssignment?.role_de || fallbackRolePayload.role_de,
      role_en: preferredAssignment?.role_en || fallbackRolePayload.role_en,
      sort_order: coach.sort_order ?? 0,
      is_active: true,
    });
  }

  for (const coachId of selectedIds) {
    if (assignmentsByCoachId.has(coachId)) continue;
    const coach = coachesById.get(coachId) || {};
    const preferredAssignment = getPreferredCurrentSeasonAssignment(
      currentSeasonAssignmentsByCoachId.get(coachId) || [],
    );
    const fallbackRolePayload = getCoachFallbackRolePayload(coach);
    createRows.push({
      coach_id: coachId,
      team_season_id: teamSeasonId,
      role_de: preferredAssignment?.role_de || fallbackRolePayload.role_de,
      role_en: preferredAssignment?.role_en || fallbackRolePayload.role_en,
      sort_order: coach.sort_order ?? 0,
      is_active: true,
    });
  }

  return {
    reactivateIds,
    deactivateIds,
    createRows,
  };
}
