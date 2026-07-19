function toUniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function hasPermission(scopeContext, permissionKey) {
  if (!permissionKey) return true;
  return toUniqueValues(scopeContext?.permissionKeys).includes(permissionKey);
}

function hasScopeType(scopeContext, scopeType) {
  if (!scopeType) return false;
  return toUniqueValues(scopeContext?.roleScopeTypes).includes(scopeType);
}

export function canAccessAll(scopeContext) {
  return Boolean(
    scopeContext?.isGlobal ||
    hasScopeType(scopeContext, "global") ||
    toUniqueValues(scopeContext?.roleKeys).includes("superadmin"),
  );
}

export function canAccessYouth(scopeContext) {
  return Boolean(
    canAccessAll(scopeContext) ||
    scopeContext?.canAccessYouthAll ||
    hasScopeType(scopeContext, "youth_all"),
  );
}

export function resolveRoleScope(scopeContext, resource = "") {
  if (canAccessAll(scopeContext)) return "global";
  if (canAccessYouth(scopeContext)) return "youth_all";

  if (resource === "profile") return "own_profile";

  if (resource === "teams") {
    if (toUniqueValues(scopeContext?.assignedTeamIds).length > 0) {
      return "assigned_teams";
    }

    return "none";
  }

  if (hasScopeType(scopeContext, "own_board_card")) {
    return "own_board_card";
  }

  if (hasScopeType(scopeContext, "own_staff_card")) {
    return "own_staff_card";
  }

  if (toUniqueValues(scopeContext?.assignedTeamIds).length > 0) {
    return "assigned_teams";
  }

  return "none";
}

export function canAccessYouthTeam(team) {
  return Boolean(team?.is_youth_team);
}

export function canAccessAssignedTeam(scopeContext, teamId) {
  if (!teamId) return false;
  if (canAccessAll(scopeContext)) return true;

  return toUniqueValues(scopeContext?.assignedTeamIds).includes(teamId);
}

export function canAccessTeam(scopeContext, teamId) {
  return canAccessAssignedTeam(scopeContext, teamId);
}

export function canEditOwnBoardCard(scopeContext, boardMember = {}) {
  if (!scopeContext || !boardMember) return false;
  if (canAccessAll(scopeContext)) return true;

  return Boolean(
    (scopeContext.boardMemberId &&
      boardMember.id &&
      scopeContext.boardMemberId === boardMember.id) ||
    (scopeContext.adminProfileId &&
      boardMember.admin_profile_id &&
      scopeContext.adminProfileId === boardMember.admin_profile_id),
  );
}

export function canEditOwnStaffCard(scopeContext, coach = {}) {
  if (!scopeContext || !coach) return false;
  if (canAccessAll(scopeContext)) return true;

  return Boolean(
    (scopeContext.coachId && coach.id && scopeContext.coachId === coach.id) ||
    (scopeContext.adminProfileId &&
      coach.admin_profile_id &&
      scopeContext.adminProfileId === coach.admin_profile_id),
  );
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

  return canAccessAssignedTeam(scopeContext, contribution?.team_id);
}

export function canEditContribution(scopeContext, contribution) {
  if (!contribution) return false;

  if (!hasPermission(scopeContext, "contributions.edit")) {
    return false;
  }

  if (canAccessAll(scopeContext)) return true;

  return canAccessAssignedTeam(scopeContext, contribution?.team_id);
}
