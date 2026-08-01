function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function uniqueStrings(values = []) {
  return Array.from(new Set((values || []).map(normalizeText).filter(Boolean)));
}

function getAssignmentRoleLabel(assignment = {}) {
  return (
    normalizeText(assignment.roleDe) ||
    normalizeText(assignment.role_de) ||
    normalizeText(assignment.roleEn) ||
    normalizeText(assignment.role_en) ||
    null
  );
}

function getCoachLegacyRoleLabel(coach = {}) {
  return (
    normalizeText(coach.role_de) ||
    normalizeText(coach.role) ||
    normalizeText(coach.role_en) ||
    null
  );
}

export function getCoachAssignmentRoleLabels(assignments = []) {
  return uniqueStrings(
    (assignments || []).map((assignment) => getAssignmentRoleLabel(assignment)),
  );
}

export function getCoachLegacyRoleLabels(coach = {}) {
  return uniqueStrings([getCoachLegacyRoleLabel(coach)]);
}

export function createCoachRoleSummary(
  assignments = [],
  coach = {},
  { defaultRoleLabel = "Trainer" } = {},
) {
  const assignmentRoleLabels = getCoachAssignmentRoleLabels(assignments);
  const legacyRoleLabels =
    assignmentRoleLabels.length === 0 ? getCoachLegacyRoleLabels(coach) : [];
  const roleLabels =
    assignmentRoleLabels.length > 0 ? assignmentRoleLabels : legacyRoleLabels;

  return {
    assignmentRoleLabels,
    legacyRoleLabels,
    roleLabels,
    primaryRoleLabel: roleLabels[0] || defaultRoleLabel,
    legacyRoleFallbackUsed:
      assignmentRoleLabels.length === 0 && legacyRoleLabels.length > 0,
  };
}
