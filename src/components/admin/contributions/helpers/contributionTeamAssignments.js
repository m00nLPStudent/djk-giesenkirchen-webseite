function compareNullable(left, right) {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortAssignments(left, right) {
  return (
    compareNullable(left.sortOrder, right.sortOrder) ||
    String(left.teamName || "").localeCompare(String(right.teamName || ""), "de") ||
    compareNullable(left.teamSeasonId, right.teamSeasonId)
  );
}

function normalizeTeamName(value) {
  const normalized = String(value || "").trim();
  return normalized || "";
}

export function getPlayerAssignmentsForSeason(playerOption = null, seasonId = "") {
  const normalizedSeasonId = String(seasonId || "").trim();
  if (!playerOption || !normalizedSeasonId) return [];

  return [...(playerOption.seasonAssignments || [])]
    .filter((assignment) => assignment?.seasonId === normalizedSeasonId)
    .sort(sortAssignments);
}

export function getContributionSnapshotFieldState({
  playerOption = null,
  seasonId = "",
  currentSeasonId = "",
}) {
  const assignments = getPlayerAssignmentsForSeason(playerOption, seasonId);
  const primaryAssignment =
    (playerOption?.primaryAssignmentBySeason || {})[String(seasonId || "").trim()] ||
    assignments[0] ||
    null;
  const isCurrentSeason =
    String(seasonId || "").trim() &&
    String(seasonId || "").trim() === String(currentSeasonId || "").trim();

  if (!playerOption || !seasonId) {
    return {
      options: [],
      defaultValue: "",
      placeholderLabel: "Optional auswaehlen",
      helpText:
        "Wird automatisch aus der Mannschaftszuordnung des Spielers fuer die gewaehlte Saison uebernommen.",
      notice: "",
      status: "idle",
    };
  }

  if (!assignments.length) {
    return {
      options: [],
      defaultValue: "",
      placeholderLabel: isCurrentSeason
        ? "Keine aktuelle Mannschaft zugeordnet"
        : "Keine Mannschaft fuer diese Saison zugeordnet",
      helpText: "Fuer diese Saison ist keine Mannschaftszuordnung vorhanden.",
      notice: "Es wurde kein Mannschaftssnapshot vorausgewaehlt.",
      status: "none",
    };
  }

  if (assignments.length === 1) {
    return {
      options: assignments.map((assignment) => ({
        value: normalizeTeamName(assignment.teamName),
        label: normalizeTeamName(assignment.teamName),
      })),
      defaultValue: normalizeTeamName(primaryAssignment?.teamName),
      placeholderLabel: "Optional auswaehlen",
      helpText:
        "Wird automatisch aus der Mannschaftszuordnung des Spielers fuer die gewaehlte Saison uebernommen.",
      notice: `Mannschaftssnapshot wurde auf ${normalizeTeamName(primaryAssignment?.teamName)} gesetzt.`,
      status: "single",
    };
  }

  return {
    options: assignments.map((assignment) => ({
      value: normalizeTeamName(assignment.teamName),
      label: normalizeTeamName(assignment.teamName),
    })),
    defaultValue: normalizeTeamName(primaryAssignment?.teamName),
    placeholderLabel: "Bitte Mannschaft auswaehlen",
    helpText: "Mehrere Mannschaften gefunden - bitte auswaehlen.",
    notice: `Mehrere Mannschaften gefunden - ${normalizeTeamName(primaryAssignment?.teamName)} wurde vorausgewaehlt.`,
    status: "multiple",
  };
}

export function buildContributionPlayerOption(player = {}, assignments = []) {
  const displayName =
    String(player.displayName || "").trim() ||
    `${player.first_name || ""} ${player.last_name || ""}`.trim() ||
    "Spieler";
  const seasonAssignments = [...(assignments || [])].sort(sortAssignments);
  const primaryAssignmentBySeason = seasonAssignments.reduce((map, assignment) => {
    if (!assignment?.seasonId || map[assignment.seasonId]) {
      return map;
    }

    return {
      ...map,
      [assignment.seasonId]: assignment,
    };
  }, {});

  return {
    value: player.id,
    label: displayName,
    playerId: player.id,
    displayName,
    isActive: player.is_active !== false,
    seasonAssignments,
    primaryAssignmentBySeason,
  };
}

