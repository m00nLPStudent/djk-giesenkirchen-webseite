const COACH_ROLE_EN = {
  Trainer: "Coach",
  "Co-Trainer": "Assistant Coach",
  Betreuer: "Supervisor",
  Torwarttrainer: "Goalkeeper Coach",
  Cheftrainer: "Head Coach",
};

function toNullableString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function toRequiredNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeRoleEn(roleDe, roleEn = null) {
  return toNullableString(roleEn) || COACH_ROLE_EN[toNullableString(roleDe)] || null;
}

function compareNullable(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function compareExistingAssignments(a, b) {
  return (
    compareNullable(a.sortOrder, b.sortOrder) ||
    compareNullable(a.createdAt, b.createdAt) ||
    compareNullable(a.coachTeamSeasonId, b.coachTeamSeasonId)
  );
}

function hasAssignmentChanges(existingAssignment, nextAssignment) {
  return (
    toNullableString(existingAssignment?.roleDe) !==
      toNullableString(nextAssignment?.roleDe) ||
    toNullableString(existingAssignment?.roleEn) !==
      normalizeRoleEn(nextAssignment?.roleDe, nextAssignment?.roleEn) ||
    toRequiredNumber(existingAssignment?.sortOrder, 0) !==
      toRequiredNumber(nextAssignment?.sortOrder, 0)
  );
}

export function buildCoachMasterPayload(
  coach,
  { primaryAssignment = null, placeholderImage } = {},
) {
  const imageUrl =
    coach?.image_url || coach?.photo_url || placeholderImage || null;
  const legacyRoleDe =
    toNullableString(coach?.role_de) ||
    toNullableString(coach?.role) ||
    "Trainer";
  const legacyRoleEn = normalizeRoleEn(legacyRoleDe);

  return {
    first_name: toNullableString(coach?.first_name),
    last_name: toNullableString(coach?.last_name),
    name:
      toNullableString(coach?.name) ||
      `${coach?.first_name || ""} ${coach?.last_name || ""}`.trim() ||
      null,
    slug: toNullableString(coach?.slug),
    role: legacyRoleDe,
    role_de: legacyRoleDe,
    role_en: legacyRoleEn,
    email: toNullableString(coach?.email),
    phone: toNullableString(coach?.phone),
    whatsapp: toNullableString(coach?.whatsapp),
    license: toNullableString(coach?.license),
    team_id: primaryAssignment?.teamId || null,
    team_name: primaryAssignment?.teamNameDe || null,
    image_url: imageUrl,
    nationality: toNullableString(coach?.nationality),
    sort_order: primaryAssignment?.sortOrder ?? toRequiredNumber(coach?.sort_order, 0),
    is_active: coach?.is_active ?? true,
  };
}

export function buildCoachMasterRollbackPayload(
  coach,
  { placeholderImage } = {},
) {
  return {
    first_name: toNullableString(coach?.first_name),
    last_name: toNullableString(coach?.last_name),
    name: toNullableString(coach?.name),
    slug: toNullableString(coach?.slug),
    role: toNullableString(coach?.role),
    role_de: toNullableString(coach?.role_de),
    role_en: toNullableString(coach?.role_en),
    email: toNullableString(coach?.email),
    phone: toNullableString(coach?.phone),
    whatsapp: toNullableString(coach?.whatsapp),
    license: toNullableString(coach?.license),
    team_id: coach?.team_id || null,
    team_name: toNullableString(coach?.team_name),
    image_url: coach?.image_url || coach?.photo_url || placeholderImage || null,
    nationality: toNullableString(coach?.nationality),
    sort_order: toRequiredNumber(coach?.sort_order, 0),
    is_active: coach?.is_active ?? true,
  };
}

export function normalizeCoachAssignments(
  assignments = [],
  teamSeasonOptions = [],
) {
  const optionByTeamSeasonId = new Map(
    (teamSeasonOptions || []).map((option) => [option.teamSeasonId, option]),
  );

  return (assignments || [])
    .map((assignment) => {
      const roleDe = toNullableString(assignment?.role_de);
      const option =
        optionByTeamSeasonId.get(assignment?.team_season_id) || null;

      return {
        coachTeamSeasonId: assignment?.coach_team_season_id || null,
        teamSeasonId: assignment?.team_season_id || null,
        teamId: option?.teamId || null,
        teamNameDe: option?.teamNameDe || null,
        seasonId: option?.seasonId || null,
        seasonName: option?.seasonName || null,
        roleDe,
        roleEn: normalizeRoleEn(roleDe, assignment?.role_en),
        isActive: assignment?.is_active ?? true,
        sortOrder: toRequiredNumber(assignment?.assignment_sort_order, 0),
      };
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return String(a.teamSeasonId || "").localeCompare(String(b.teamSeasonId || ""));
    });
}

export function buildCoachAssignmentPayload(assignment, teamSeasonOption = {}) {
  return {
    team_season_id: teamSeasonOption.teamSeasonId || null,
    role_de: toNullableString(assignment?.roleDe),
    role_en: normalizeRoleEn(assignment?.roleDe, assignment?.roleEn),
    is_active: assignment?.isActive ?? true,
    sort_order: toRequiredNumber(assignment?.sortOrder, 0),
  };
}

export function determineCoachAssignmentOperations(
  existingReadModel,
  normalizedAssignments = [],
) {
  const duplicateKeys = new Set();
  for (const assignment of normalizedAssignments) {
    if (!assignment.teamSeasonId || !assignment.roleDe) {
      return {
        ok: false,
        code: "INVALID_COACH_ASSIGNMENT",
        message:
          "Jede Trainerzuordnung benoetigt eine Mannschaft der aktuellen Saison und eine Rolle.",
      };
    }
    if (duplicateKeys.has(assignment.teamSeasonId)) {
      return {
        ok: false,
        code: "DUPLICATE_TEAM_SEASON_ASSIGNMENT",
        message:
          "Dieselbe Mannschaft darf im Trainerformular nur einmal ausgewaehlt werden.",
      };
    }
    duplicateKeys.add(assignment.teamSeasonId);
  }

  const existingAssignments = [...(existingReadModel?.assignments || [])].sort(
    compareExistingAssignments,
  );
  const existingById = new Map(
    existingAssignments.map((assignment) => [
      assignment.coachTeamSeasonId,
      assignment,
    ]),
  );
  const existingByTeamSeasonId = new Map(
    existingAssignments.map((assignment) => [assignment.teamSeasonId, assignment]),
  );
  const updates = [];
  const reactivations = [];
  const inserts = [];
  const unchangedIds = [];
  const retainedExistingIds = new Set();
  const deactivateIds = new Set();

  for (const assignment of normalizedAssignments) {
    if (
      assignment.coachTeamSeasonId &&
      !existingById.has(assignment.coachTeamSeasonId)
    ) {
      return {
        ok: false,
        code: "UNKNOWN_COACH_ASSIGNMENT",
        message:
          "Mindestens eine bestehende Trainerzuordnung konnte nicht mehr aufgeloest werden.",
      };
    }

    const existingAssignment =
      existingByTeamSeasonId.get(assignment.teamSeasonId) || null;

    if (!existingAssignment) {
      inserts.push({ ...assignment, coachTeamSeasonId: null });
      continue;
    }

    retainedExistingIds.add(existingAssignment.coachTeamSeasonId);

    if (existingAssignment.isActive === false) {
      reactivations.push({
        ...assignment,
        coachTeamSeasonId: existingAssignment.coachTeamSeasonId,
      });
      continue;
    }

    if (hasAssignmentChanges(existingAssignment, assignment)) {
      updates.push({
        ...assignment,
        coachTeamSeasonId: existingAssignment.coachTeamSeasonId,
      });
      continue;
    }

    unchangedIds.push(existingAssignment.coachTeamSeasonId);
  }

  for (const existingAssignment of existingAssignments) {
    if (
      existingAssignment?.coachTeamSeasonId &&
      existingAssignment.isActive !== false &&
      !retainedExistingIds.has(existingAssignment.coachTeamSeasonId) &&
      !deactivateIds.has(existingAssignment.coachTeamSeasonId)
    ) {
      deactivateIds.add(existingAssignment.coachTeamSeasonId);
    }
  }

  return {
    ok: true,
    updates,
    reactivations,
    inserts,
    unchangedIds,
    deactivateIds: Array.from(deactivateIds),
  };
}
