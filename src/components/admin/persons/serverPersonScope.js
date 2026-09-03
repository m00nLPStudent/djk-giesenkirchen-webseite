import "server-only";

import {
  canAccessAll,
  canAccessAssignedTeam,
  canAccessYouth,
  loadAdminProfileScopeContext,
} from "@/lib/admin-auth/scopes";
import { isYouthTeam } from "@/components/admin/teams/teamScope";
import {
  getCoachTeamIdsMap as getCoachTeamIdsMapFromRepository,
  getPlayerTeamIdsMap as getPlayerTeamIdsMapFromRepository,
} from "./personTeamRepository";
import {
  canAccessBoardMember,
  isBoardGlobalBusinessManager,
} from "@/components/admin/board/boardRoleContract.core.mjs";

const GLOBAL_PERSON_MODULE_ROLE_KEYS = ["vorstand"];

function normalizePermissionKeys(permissions = []) {
  return (permissions || [])
    .map((permission) => permission?.key || permission)
    .filter(Boolean);
}

function normalizeRoleKeys(roles = []) {
  return (roles || []).map((role) => role?.key).filter(Boolean);
}

function hasScopeType(scopeContext, type) {
  return Boolean((scopeContext?.roleScopeTypes || []).includes(type));
}

function hasRoleKey(scopeContext, roleKey) {
  return Boolean((scopeContext?.roleKeys || []).includes(roleKey));
}

function canAccessAllPersonModules(scopeContext) {
  return (
    canAccessAll(scopeContext) ||
    GLOBAL_PERSON_MODULE_ROLE_KEYS.some((roleKey) =>
      hasRoleKey(scopeContext, roleKey),
    )
  );
}

function canReadPeopleGlobally(scopeContext) {
  return (
    canAccessAllPersonModules(scopeContext) ||
    hasScopeType(scopeContext, "read_only")
  );
}

export function isDepartmentManagerScope(scopeContext) {
  return Boolean(scopeContext?.managedDepartmentId && hasScopeType(scopeContext, "department_manager"));
}

function isOwnCoachCard(scopeContext, coach = {}) {
  if (!scopeContext || !coach) return false;

  return Boolean(
    scopeContext.adminProfileId &&
    coach.admin_profile_id &&
    scopeContext.adminProfileId === coach.admin_profile_id,
  );
}

function isYouthTeamId(teamId, teamById = new Map()) {
  const team = teamById.get(teamId) || null;
  return Boolean(team && isYouthTeam(team));
}

function hasAssignedTeamOverlap(scopeContext, teamIds = []) {
  return (teamIds || []).some((teamId) =>
    canAccessAssignedTeam(scopeContext, teamId),
  );
}

function canMutateAllTargetTeams(
  scopeContext,
  teamIds = [],
  teamById = new Map(),
) {
  if (canAccessAllPersonModules(scopeContext)) return true;
  if (!teamIds.length) return false;

  if (isDepartmentManagerScope(scopeContext)) {
    return teamIds.every((teamId) => canAccessAssignedTeam(scopeContext, teamId));
  }

  if (canAccessYouth(scopeContext)) {
    return teamIds.every((teamId) => isYouthTeamId(teamId, teamById));
  }

  return teamIds.every((teamId) => canAccessAssignedTeam(scopeContext, teamId));
}

export async function loadServerPersonScopeContext(permissionResult) {
  const scopeResult = await loadAdminProfileScopeContext({
    adminProfileId: permissionResult?.profile?.id || null,
    userId: permissionResult?.userId || null,
    roleKeys: normalizeRoleKeys(permissionResult?.roles),
    permissionKeys: normalizePermissionKeys(permissionResult?.permissions),
    supabase: permissionResult?.supabaseServer || null,
  });

  return scopeResult?.context || null;
}

export async function getPlayerTeamIdsMap(
  supabaseServer,
  playerIds = [],
  { activeSeasonId = null } = {},
) {
  return await getPlayerTeamIdsMapFromRepository(supabaseServer, playerIds, {
    activeSeasonId,
  });
}

export async function getPlayerAssignedTeamIds(supabaseServer, playerId) {
  const { teamIdsByPlayerId } = await getPlayerTeamIdsMap(supabaseServer, [
    playerId,
  ]);
  return teamIdsByPlayerId.get(playerId) || [];
}

export async function getCoachTeamIdsMap(
  supabaseServer,
  coachIds = [],
  { activeSeasonId = null, includeLegacyFallback = false } = {},
) {
  return await getCoachTeamIdsMapFromRepository(supabaseServer, coachIds, {
    activeSeasonId,
    includeLegacyFallback,
  });
}

export async function getCoachTeamIds(supabaseServer, coachId) {
  const { teamIdsByCoachId } = await getCoachTeamIdsMap(supabaseServer, [
    coachId,
  ]);
  return teamIdsByCoachId.get(coachId) || [];
}

export function canViewPlayerOnServer(
  scopeContext,
  playerTeamIds = [],
  teamById = new Map(),
  player = {},
) {
  if (canReadPeopleGlobally(scopeContext)) return true;
  if (isDepartmentManagerScope(scopeContext)) return player.department_id === scopeContext.managedDepartmentId;

  if (canAccessYouth(scopeContext)) {
    return playerTeamIds.some((teamId) => isYouthTeamId(teamId, teamById));
  }

  return hasAssignedTeamOverlap(scopeContext, playerTeamIds);
}

export function canEditPlayerOnServer(
  scopeContext,
  playerTeamIds = [],
  teamById = new Map(),
  player = {},
) {
  if (isDepartmentManagerScope(scopeContext)) return player.department_id === scopeContext.managedDepartmentId;
  return canMutateAllTargetTeams(scopeContext, playerTeamIds, teamById);
}

export function canCreatePlayerOnServer(
  scopeContext,
  targetTeamIds = [],
  teamById = new Map(),
) {
  return canMutateAllTargetTeams(scopeContext, targetTeamIds, teamById);
}

export function canDeletePlayerOnServer(
  scopeContext,
  playerTeamIds = [],
  teamById = new Map(),
  player = {},
) {
  if (isDepartmentManagerScope(scopeContext)) return player.department_id === scopeContext.managedDepartmentId;
  return canMutateAllTargetTeams(scopeContext, playerTeamIds, teamById);
}

export function canViewCoachOnServer(
  scopeContext,
  coach = {},
  coachTeamIds = [],
  teamById = new Map(),
) {
  if (canReadPeopleGlobally(scopeContext)) return true;
  if (isOwnCoachCard(scopeContext, coach)) return true;
  if (isDepartmentManagerScope(scopeContext)) return coach.department_id === scopeContext.managedDepartmentId;

  if (canAccessYouth(scopeContext)) {
    return coachTeamIds.some((teamId) => isYouthTeamId(teamId, teamById));
  }

  return hasAssignedTeamOverlap(scopeContext, coachTeamIds);
}

export function canEditCoachOnServer(
  scopeContext,
  coach = {},
  coachTeamIds = [],
  teamById = new Map(),
) {
  if (canAccessAllPersonModules(scopeContext)) return true;
  if (isDepartmentManagerScope(scopeContext)) {
    return coach.department_id === scopeContext.managedDepartmentId;
  }
  if (isOwnCoachCard(scopeContext, coach)) return true;

  if (canAccessYouth(scopeContext)) {
    return (
      coachTeamIds.length > 0 &&
      coachTeamIds.every((teamId) => isYouthTeamId(teamId, teamById))
    );
  }

  return false;
}

export function canCreateCoachOnServer(scopeContext) {
  return (
    canAccessAllPersonModules(scopeContext) || isDepartmentManagerScope(scopeContext) || canAccessYouth(scopeContext)
  );
}

export function canDeleteCoachOnServer(
  scopeContext,
  coach = {},
  coachTeamIds = [],
  teamById = new Map(),
) {
  if (canAccessAllPersonModules(scopeContext)) return true;

  if (isDepartmentManagerScope(scopeContext)) {
    return coach.department_id === scopeContext.managedDepartmentId;
  }

  if (canAccessYouth(scopeContext)) {
    return (
      coachTeamIds.length > 0 &&
      coachTeamIds.every((teamId) => isYouthTeamId(teamId, teamById))
    );
  }

  return false;
}

export function canViewBoardMemberOnServer(scopeContext, boardMember = {}) {
  return canAccessBoardMember(scopeContext, boardMember);
}

export function canAccessBoardDepartmentOnServer(scopeContext, boardMember = {}) {
  if (canAccessAll(scopeContext)) return true;
  return Boolean(
    scopeContext?.managedDepartmentId
    && boardMember?.organization_scope === "department"
    && boardMember?.department_id === scopeContext.managedDepartmentId,
  );
}

export function canEditBoardMemberOnServer(scopeContext, boardMember = {}) {
  return canAccessBoardMember(scopeContext, boardMember);
}

export function canCreateBoardMemberOnServer(scopeContext) {
  return isBoardGlobalBusinessManager(scopeContext);
}

export function canDeleteBoardMemberOnServer(scopeContext) {
  return isBoardGlobalBusinessManager(scopeContext);
}

export { isBoardGlobalBusinessManager as canManageAllBoardMembersOnServer };

export async function loadScopedActiveTeamsForPeople(
  scopeContext,
  supabaseServer,
) {
  const { data: teams, error } = await supabaseServer
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(
      `teams query failed in loadScopedActiveTeamsForPeople: ${error.message}`,
    );
  }

  const teamList = (teams || []).filter((team) => team?.is_active !== false);

  if (canAccessAllPersonModules(scopeContext)) {
    return teamList;
  }

  if (canAccessYouth(scopeContext)) {
    return teamList.filter((team) => isYouthTeam(team));
  }

  const assignedTeamIds = new Set(scopeContext?.assignedTeamIds || []);
  if (assignedTeamIds.size === 0) {
    return [];
  }

  return teamList.filter((team) => assignedTeamIds.has(team.id));
}
