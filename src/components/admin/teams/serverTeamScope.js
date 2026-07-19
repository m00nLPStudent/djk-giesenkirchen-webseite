import "server-only";

import { loadAdminProfileScopeContext } from "@/lib/admin-auth/scopes";
import { resolveRoleScope } from "@/lib/admin-auth/scopes/scopeEngine";
import {
  canAccessTeamInScope,
  canReachTeamCreate,
  filterTeamsByScope,
} from "./teamScope";

function normalizePermissionKeys(permissions = []) {
  return (permissions || [])
    .map((permission) => permission?.key || permission)
    .filter(Boolean);
}

function normalizeRoleKeys(roles = []) {
  return (roles || []).map((role) => role?.key).filter(Boolean);
}

export async function loadServerTeamScopeContext(permissionResult) {
  const scopeResult = await loadAdminProfileScopeContext({
    adminProfileId: permissionResult?.profile?.id || null,
    userId: permissionResult?.userId || null,
    roleKeys: normalizeRoleKeys(permissionResult?.roles),
    permissionKeys: normalizePermissionKeys(permissionResult?.permissions),
    supabase: permissionResult?.supabaseServer || null,
  });

  return scopeResult?.context || null;
}

export function resolveTeamScopeType(scopeContext) {
  return resolveRoleScope(scopeContext, "teams");
}

export function filterScopedTeamsOnServer(scopeContext, teams = []) {
  return filterTeamsByScope(scopeContext, teams);
}

export function canAccessTeamOnServer(scopeContext, team = {}) {
  return canAccessTeamInScope(scopeContext, team);
}

export function canReachTeamCreateOnServer(scopeContext) {
  return canReachTeamCreate(scopeContext);
}
