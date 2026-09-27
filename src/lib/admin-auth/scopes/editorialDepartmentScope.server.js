import "server-only";

import { loadServerTeamScopeContext } from "@/components/admin/teams/serverTeamScope";
import { resolveEditorialDepartmentScope } from "./editorialDepartmentScope.core.mjs";

export async function loadEditorialDepartmentScope(permissionResult) {
  const context = await loadServerTeamScopeContext(permissionResult);
  return { context, scope: resolveEditorialDepartmentScope(context || {}) };
}
