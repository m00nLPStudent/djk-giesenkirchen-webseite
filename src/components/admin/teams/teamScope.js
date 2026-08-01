import {
  canAccessAll,
  canAccessAssignedTeam,
  canAccessYouth,
} from "@/lib/admin-auth/scopes/scopeEngine";

const GLOBAL_TEAM_MODULE_ROLE_KEYS = ["vorstand", "fussball-vorstand"];

function hasRoleKey(scopeContext, roleKey) {
  return Boolean((scopeContext?.roleKeys || []).includes(roleKey));
}

function canAccessAllTeamsModule(scopeContext) {
  return (
    canAccessAll(scopeContext) ||
    GLOBAL_TEAM_MODULE_ROLE_KEYS.some((roleKey) =>
      hasRoleKey(scopeContext, roleKey),
    )
  );
}

function normalizeText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function isYouthTeam(team = {}) {
  const ageGroup = normalizeText(team?.age_group);
  const nameDe = normalizeText(team?.name_de);

  if (team?.is_youth_team === true) return true;
  if (!ageGroup && !nameDe) return false;

  const value = `${ageGroup} ${nameDe}`;

  if (
    value.includes("damen") ||
    value.includes("herren") ||
    value.includes("senior")
  ) {
    return false;
  }

  return true;
}

export function canAccessTeamInScope(scopeContext, team = {}) {
  if (!team?.id) return false;

  if (canAccessAllTeamsModule(scopeContext)) return true;

  if (canAccessYouth(scopeContext) && isYouthTeam(team)) {
    return true;
  }

  return canAccessAssignedTeam(scopeContext, team.id);
}

export function filterTeamsByScope(scopeContext, teams = []) {
  return (teams || []).filter((team) =>
    canAccessTeamInScope(scopeContext, team),
  );
}

export function canCreateTeamInScope(scopeContext, draftTeam = {}) {
  if (canAccessAllTeamsModule(scopeContext)) return true;

  if (canAccessYouth(scopeContext)) {
    return isYouthTeam(draftTeam);
  }

  return false;
}

export function canReachTeamCreate(scopeContext) {
  return canAccessAllTeamsModule(scopeContext) || canAccessYouth(scopeContext);
}

export function hasTeamManagementScope(scopeContext) {
  if (canAccessAllTeamsModule(scopeContext)) return true;
  if (canAccessYouth(scopeContext)) return true;
  return (scopeContext?.assignedTeamIds || []).length > 0;
}
