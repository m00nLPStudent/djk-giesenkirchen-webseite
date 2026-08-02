import { createCoachRoleSummary } from "./coachRoleSummary.mjs";
import { resolveCoachImageUrl } from "../../../lib/people/imageUrl.js";

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeCoachNameFallback(value) {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  if (normalized.toLowerCase() === "kontaktperson") return null;
  return normalized;
}

function uniqueStrings(values = []) {
  return Array.from(
    new Set((values || []).map(normalizeText).filter(Boolean)),
  );
}

function getAssignmentTeamName(assignment = {}) {
  return assignment.teamNameDe || assignment.teamNameEn || null;
}

function getAssignmentRoleLabel(assignment = {}) {
  return assignment.roleDe || assignment.roleEn || null;
}

function mapCoachAssignment(assignment = {}) {
  return {
    coachTeamSeasonId: assignment.coachTeamSeasonId || null,
    teamSeasonId: assignment.teamSeasonId || null,
    teamId: assignment.teamId || null,
    teamNameDe: assignment.teamNameDe || null,
    teamNameEn: assignment.teamNameEn || null,
    teamSlug: assignment.teamSlug || null,
    roleDe: assignment.roleDe || null,
    roleEn: assignment.roleEn || null,
    sortOrder: assignment.sortOrder ?? null,
  };
}

function createTeamNames(assignments = [], seasonalReadModel = {}) {
  const names = uniqueStrings(
    assignments.map((assignment) => getAssignmentTeamName(assignment)),
  );

  if (names.length > 0) return names;

  return uniqueStrings([seasonalReadModel.legacyTeamName]);
}

function createPrimaryTeam(assignments = [], seasonalReadModel = {}) {
  const primaryAssignment = assignments[0] || null;
  if (primaryAssignment) {
    return {
      id: primaryAssignment.teamId,
      name: getAssignmentTeamName(primaryAssignment) || "Keine Mannschaft",
      slug: primaryAssignment.teamSlug || null,
    };
  }

  if (seasonalReadModel.legacyTeamName) {
    return {
      id: seasonalReadModel.legacyTeamId || null,
      name: seasonalReadModel.legacyTeamName,
      slug: null,
    };
  }

  return {
    id: null,
    name: "Keine Mannschaft",
    slug: null,
  };
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
    compareNullable(a.coachTeamSeasonId, b.coachTeamSeasonId)
  );
}

export function getCoachDisplayName(coach = {}) {
  return normalizeText(`${coach.first_name || ""} ${coach.last_name || ""}`) ||
    normalizeCoachNameFallback(coach.name) ||
    "Name nicht hinterlegt";
}

export function getCoachImageUrl(coach = {}, fallbackImage = null) {
  return resolveCoachImageUrl(coach, fallbackImage);
}

export function createCoachReadDto(
  coach = {},
  seasonalReadModel = {},
  { includeAdminProfileLinked = false } = {},
) {
  const assignments = (seasonalReadModel.assignments || [])
    .map(mapCoachAssignment)
    .sort(compareAssignments);
  const primaryAssignment = assignments[0] || null;
  const roleSummary = createCoachRoleSummary(assignments, coach);
  const roleLabels = roleSummary.roleLabels;
  const teamNames = createTeamNames(assignments, seasonalReadModel);
  const primaryTeam = createPrimaryTeam(assignments, seasonalReadModel);
  const displayName = getCoachDisplayName(coach);

  const dto = {
    id: coach.id || seasonalReadModel.coachId || null,
    coachId: coach.id || seasonalReadModel.coachId || null,
    firstName: coach.first_name || "",
    lastName: coach.last_name || "",
    displayName,
    slug: coach.slug || null,
    imageUrl: getCoachImageUrl(coach),
    assignments,
    primaryAssignment,
    hasMultipleActiveAssignments: Boolean(
      seasonalReadModel.hasMultipleActiveAssignments,
    ),
    hasActiveAssignment: Boolean(seasonalReadModel.hasActiveAssignment),
    isActive: coach.is_active ?? true,
    email: coach.email || "",
    phone: coach.phone || "",
    whatsapp: coach.whatsapp || "",
    license: coach.license || "",
    nationality: coach.nationality || "",
    sortOrder: coach.sort_order ?? primaryAssignment?.sortOrder ?? 0,
    roleLabels,
    primaryRoleLabel: roleSummary.primaryRoleLabel,
    legacyRoleFallbackUsed: roleSummary.legacyRoleFallbackUsed,
    legacyRoleLabels: roleSummary.legacyRoleLabels,
    teamNames,
    primaryTeamName: primaryTeam.name,
    teams: primaryTeam.id
      ? {
          id: primaryTeam.id,
          name_de: primaryTeam.name,
          slug: primaryTeam.slug,
        }
      : null,
    legacyFallbackUsed: Boolean(seasonalReadModel.legacyFallbackUsed),
    activeSeasonStatus: seasonalReadModel.activeSeasonStatus || null,
  };

  if (includeAdminProfileLinked) {
    dto.adminProfileLinked = Boolean(coach.admin_profile_id);
  }

  return dto;
}

export function filterCoachAssignmentsByTeamId(assignments = [], teamId) {
  return (assignments || []).filter((assignment) => assignment.teamId === teamId);
}

export function createCoachTeamView(coach = {}, teamId = null) {
  const teamAssignments = filterCoachAssignmentsByTeamId(coach.assignments, teamId);
  const teamRoleSummary = createCoachRoleSummary(teamAssignments, {}, {
    defaultRoleLabel: null,
  });

  return {
    ...coach,
    teamAssignments,
    teamRoleLabels: teamRoleSummary.assignmentRoleLabels,
    teamPrimaryRoleLabel: teamRoleSummary.assignmentRoleLabels[0] || null,
    teamRoleDisplayLabel:
      teamRoleSummary.assignmentRoleLabels.join(", ") || "Rolle offen",
    teamRoleFallbackUsed: teamRoleSummary.assignmentRoleLabels.length === 0,
  };
}
