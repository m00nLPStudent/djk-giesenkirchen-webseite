export const PLAYER_ASSIGNMENT_OPERATIONS = {
  CREATE: "CREATE_ASSIGNMENT",
  UPDATE: "UPDATE_ASSIGNMENT",
  REACTIVATE: "REACTIVATE_ASSIGNMENT",
  DEACTIVATE: "DEACTIVATE_ASSIGNMENT",
  UNCHANGED: "UNCHANGED_ASSIGNMENT",
};

function toNullableNumber(value) {
  if (value === "" || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toRequiredNumber(value, fallback = 0) {
  const normalized = toNullableNumber(value);
  return normalized == null ? fallback : normalized;
}

function toNullableString(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

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
    compareNullable(a.sortOrder, b.sortOrder) ||
    compareNullable(a.createdAt, b.createdAt) ||
    compareNullable(a.playerTeamSeasonId, b.playerTeamSeasonId)
  );
}

function hasAssignmentChanges(existingAssignment, nextAssignment) {
  return (
    toNullableNumber(existingAssignment?.shirtNumber) !==
      toNullableNumber(nextAssignment?.shirtNumber) ||
    toNullableString(existingAssignment?.positionDe) !==
      toNullableString(nextAssignment?.positionDe) ||
    toNullableString(existingAssignment?.positionEn) !==
      toNullableString(nextAssignment?.positionEn) ||
    Boolean(existingAssignment?.isCaptain) !== Boolean(nextAssignment?.isCaptain) ||
    toRequiredNumber(existingAssignment?.sortOrder, 0) !==
      toRequiredNumber(nextAssignment?.sortOrder, 0)
  );
}

export function buildPlayerMasterPayload(
  player,
  { placeholderImage } = {},
) {
  const imageUrl =
    player?.image_url || player?.photo_url || placeholderImage || null;

  return {
    first_name: toNullableString(player?.first_name),
    last_name: toNullableString(player?.last_name),
    image_url: imageUrl,
    is_active: player?.is_active ?? true,
    description_de: toNullableString(player?.description_de),
    description_en: toNullableString(player?.description_en),
    birthdate: player?.birthdate || null,
    joined_at: player?.joined_at || null,
    year_group: toNullableString(player?.year_group),
    strong_foot: toNullableString(player?.strong_foot),
    strong_hand: toNullableString(player?.strong_hand),
    nationality: toNullableString(player?.nationality),
    gender: toNullableString(player?.gender),
    department_id: player?.department_id || null,
  };
}

export function buildPlayerMasterRollbackPayload(
  player,
  { placeholderImage } = {},
) {
  return buildPlayerMasterPayload(
    {
      ...player,
      image_url: player?.image_url || player?.photo_url,
    },
    { placeholderImage },
  );
}

export function buildPlayerAssignmentPayload(player, teamSeasonOption = {}) {
  return {
    team_season_id: teamSeasonOption.teamSeasonId || null,
    shirt_number: toNullableNumber(player?.shirt_number),
    position_de: toNullableString(player?.position_de),
    position_en: toNullableString(player?.position_en),
    is_captain: player?.is_captain ?? false,
    is_active: true,
    sort_order: toRequiredNumber(player?.assignment_sort_order, 0),
  };
}

export function determinePlayerAssignmentOperation(
  existingAssignments = [],
  targetAssignment = {},
) {
  const sortedAssignments = [...(existingAssignments || [])].sort(compareAssignments);
  const activeAssignments = sortedAssignments.filter(
    (assignment) => assignment?.isActive !== false,
  );

  if (activeAssignments.length > 1) {
    return {
      ok: false,
      code: "MULTIPLE_ACTIVE_CURRENT_ASSIGNMENTS",
      message:
        "Der Spieler hat mehrere aktive Zuordnungen in der aktuellen Saison. Bitte bereinige diesen Konflikt zuerst.",
    };
  }

  const currentAssignment = activeAssignments[0] || null;
  if (!targetAssignment?.teamSeasonId) {
    return currentAssignment
      ? {
          ok: true,
          operation: PLAYER_ASSIGNMENT_OPERATIONS.DEACTIVATE,
          currentAssignmentId: currentAssignment.playerTeamSeasonId,
        }
      : {
          ok: true,
          operation: PLAYER_ASSIGNMENT_OPERATIONS.UNCHANGED,
          currentAssignmentId: null,
        };
  }

  const existingByTeamSeasonId = new Map(
    sortedAssignments.map((assignment) => [assignment.teamSeasonId, assignment]),
  );
  const matchingAssignment =
    existingByTeamSeasonId.get(targetAssignment.teamSeasonId) || null;

  if (!currentAssignment) {
    if (matchingAssignment?.isActive === false) {
      return {
        ok: true,
        operation: PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE,
        targetAssignmentId: matchingAssignment.playerTeamSeasonId,
      };
    }

    return {
      ok: true,
      operation: PLAYER_ASSIGNMENT_OPERATIONS.CREATE,
    };
  }

  if (currentAssignment.teamSeasonId === targetAssignment.teamSeasonId) {
    return {
      ok: true,
      operation: hasAssignmentChanges(currentAssignment, targetAssignment)
        ? PLAYER_ASSIGNMENT_OPERATIONS.UPDATE
        : PLAYER_ASSIGNMENT_OPERATIONS.UNCHANGED,
      currentAssignmentId: currentAssignment.playerTeamSeasonId,
    };
  }

  if (matchingAssignment?.isActive === false) {
    return {
      ok: true,
      operation: PLAYER_ASSIGNMENT_OPERATIONS.REACTIVATE,
      currentAssignmentId: currentAssignment.playerTeamSeasonId,
      targetAssignmentId: matchingAssignment.playerTeamSeasonId,
    };
  }

  return {
    ok: true,
    operation: PLAYER_ASSIGNMENT_OPERATIONS.CREATE,
    deactivateCurrentAssignmentId: currentAssignment.playerTeamSeasonId,
  };
}
