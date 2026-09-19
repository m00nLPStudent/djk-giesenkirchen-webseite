const GLOBAL_PERSON_ROLE_KEYS = new Set(["superadmin", "vorstand"]);

function values(input = []) {
  return (input || []).filter(Boolean);
}

function isGlobalPersonScope(scopeContext = {}) {
  return Boolean(
    scopeContext?.isGlobal
      || values(scopeContext?.roleScopeTypes).includes("global")
      || values(scopeContext?.roleKeys).some((key) => GLOBAL_PERSON_ROLE_KEYS.has(key)),
  );
}

export function isPlayerDepartmentManagerScope(scopeContext = {}) {
  return Boolean(
    scopeContext?.managedDepartmentId
      && values(scopeContext?.roleScopeTypes).includes("department_manager"),
  );
}

export function resolvePlayerDepartmentScopeDecision(
  scopeContext,
  { departmentId = null, teamIds = [], teamById = new Map() } = {},
) {
  if (isGlobalPersonScope(scopeContext)) return true;
  if (!isPlayerDepartmentManagerScope(scopeContext)) return null;

  const normalizedTeamIds = values(teamIds);
  const teamDepartmentIds = normalizedTeamIds
    .map((teamId) => teamById.get(teamId)?.department_id || null);
  if (teamDepartmentIds.some((teamDepartmentId) => !teamDepartmentId)) return false;

  const targetDepartmentIds = [departmentId, ...teamDepartmentIds].filter(Boolean);
  if (!targetDepartmentIds.length) return false;

  return targetDepartmentIds.every(
    (targetDepartmentId) => targetDepartmentId === scopeContext.managedDepartmentId,
  );
}
