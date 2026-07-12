function hasPermission(scopeContext, permissionKey) {
  if (!permissionKey) return true;
  return scopeContext?.permissionKeys?.has(permissionKey) || false;
}

function hasScopeType(scopeContext, scopeType) {
  if (!scopeType) return false;
  return scopeContext?.roleScopeTypes?.has(scopeType) || false;
}

export function canAccessAll(scopeContext) {
  return (
    hasScopeType(scopeContext, "global") ||
    scopeContext?.roleKeys?.has("superadmin") ||
    false
  );
}

export function canAccessYouth(scopeContext) {
  return canAccessAll(scopeContext) || hasScopeType(scopeContext, "youth_all");
}

export function resolveRoleScope(scopeContext, resource = "") {
  if (canAccessAll(scopeContext)) return "global";
  if (canAccessYouth(scopeContext)) return "youth_all";

  if (resource === "profile") return "own_profile";

  if (scopeContext?.assignedTeamIds?.size > 0) {
    return "assigned_teams";
  }

  return "none";
}

export function canAccessYouthTeam(team) {
  return Boolean(team?.is_youth_team);
}

function canAccessAssignedTeamFromContext(scopeContext, teamId) {
  if (!teamId) return false;
  if (canAccessAll(scopeContext)) return true;

  return scopeContext?.assignedTeamIds?.has(teamId) || false;
}

export function canAccessAssignedTeam(
  adminProfileId,
  teamId,
  assignedTeamIds = [],
) {
  if (!adminProfileId || !teamId) return false;
  return new Set(assignedTeamIds || []).has(teamId);
}

export function canEditOwnBoardCard(
  adminProfileId,
  boardMemberOwnerAdminProfileId,
) {
  if (!adminProfileId || !boardMemberOwnerAdminProfileId) return false;
  return adminProfileId === boardMemberOwnerAdminProfileId;
}

export function canEditOwnStaffCard(adminProfileId, coachOwnerAdminProfileId) {
  if (!adminProfileId || !coachOwnerAdminProfileId) return false;
  return adminProfileId === coachOwnerAdminProfileId;
}

export function canEditOwnContent(adminProfileId, createdByAdminProfileId) {
  if (!adminProfileId || !createdByAdminProfileId) return false;
  return adminProfileId === createdByAdminProfileId;
}

export function canViewContribution(scopeContext, contribution) {
  if (!contribution) return false;

  if (
    canAccessAll(scopeContext) ||
    hasPermission(scopeContext, "contributions.view")
  ) {
    return true;
  }

  if (
    canAccessYouth(scopeContext) &&
    canAccessYouthTeam(contribution?.team || null)
  ) {
    return true;
  }

  return canAccessAssignedTeamFromContext(scopeContext, contribution?.team_id);
}

export function canEditContribution(scopeContext, contribution) {
  if (!contribution) return false;

  if (!hasPermission(scopeContext, "contributions.edit")) {
    return false;
  }

  if (canAccessAll(scopeContext)) return true;

  return canAccessAssignedTeamFromContext(scopeContext, contribution?.team_id);
}
