import { resolvePlayerImageUrl } from "../../../lib/people/imageUrl.js";

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function uniqueStrings(values = []) {
  return Array.from(
    new Set((values || []).map(normalizeText).filter(Boolean)),
  );
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
    compareNullable(a.playerTeamSeasonId, b.playerTeamSeasonId)
  );
}

function getAssignmentTeamName(assignment = {}) {
  return assignment.teamNameDe || assignment.teamNameEn || null;
}

function mapPlayerAssignment(assignment = {}) {
  return {
    playerTeamSeasonId: assignment.playerTeamSeasonId || null,
    teamSeasonId: assignment.teamSeasonId || null,
    teamId: assignment.teamId || null,
    teamNameDe: assignment.teamNameDe || null,
    teamNameEn: assignment.teamNameEn || null,
    teamSlug: assignment.teamSlug || null,
    seasonId: assignment.seasonId || null,
    seasonName: assignment.seasonName || null,
    shirtNumber: assignment.shirtNumber ?? null,
    positionDe: assignment.positionDe || null,
    positionEn: assignment.positionEn || null,
    isCaptain: Boolean(assignment.isCaptain),
    sortOrder: assignment.sortOrder ?? null,
    isActive: assignment.isActive !== false,
    ageGroup: assignment.ageGroup || null,
  };
}

function createTeamNames(assignments = []) {
  return uniqueStrings(
    assignments.map((assignment) => getAssignmentTeamName(assignment)),
  );
}

function createPrimaryTeam(assignments = []) {
  const primaryAssignment = assignments[0] || null;
  if (!primaryAssignment?.teamId) return null;

  return {
    id: primaryAssignment.teamId,
    name_de: getAssignmentTeamName(primaryAssignment) || "Keine Mannschaft",
    slug: primaryAssignment.teamSlug || null,
    age_group: primaryAssignment.ageGroup || null,
  };
}

export function getPlayerDisplayName(player = {}) {
  return (
    normalizeText(`${player.first_name || ""} ${player.last_name || ""}`) ||
    "Spieler"
  );
}

export function getPlayerImageUrl(player = {}, fallbackImage = null) {
  return resolvePlayerImageUrl(player, fallbackImage);
}

export function createPlayerReadDto(player = {}, seasonalReadModel = {}) {
  const assignments = (seasonalReadModel.assignments || [])
    .map(mapPlayerAssignment)
    .sort(compareAssignments);
  const primaryAssignment = assignments[0] || null;
  const teamNames = createTeamNames(assignments);
  const teams = createPrimaryTeam(assignments);

  return {
    id: player.id || seasonalReadModel.playerId || null,
    playerId: player.id || seasonalReadModel.playerId || null,
    firstName: player.first_name || "",
    lastName: player.last_name || "",
    displayName: getPlayerDisplayName(player),
    imageUrl: getPlayerImageUrl(player),
    assignments,
    primaryAssignment,
    hasMultipleActiveAssignments: Boolean(
      seasonalReadModel.hasMultipleActiveAssignments,
    ),
    hasActiveAssignment: Boolean(seasonalReadModel.hasActiveAssignment),
    isActive: player.is_active ?? true,
    shirtNumber: primaryAssignment?.shirtNumber ?? null,
    positionDe: primaryAssignment?.positionDe || "",
    positionEn: primaryAssignment?.positionEn || "",
    isCaptain: primaryAssignment?.isCaptain ?? false,
    birthdate: player.birthdate || null,
    joinedAt: player.joined_at || null,
    yearGroup: player.year_group || "",
    strongFoot: player.strong_foot || "",
    descriptionDe: player.description_de || "",
    descriptionEn: player.description_en || "",
    nationality: player.nationality || "",
    gender: player.gender || "",
    createdAt: player.created_at || null,
    teamNames,
    primaryTeamName: teams?.name_de || "Keine Mannschaft",
    teams,
    activeSeasonStatus: seasonalReadModel.activeSeasonStatus || null,
  };
}
