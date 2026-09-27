import { DEPARTMENT_MANAGER_ROLE_SLUGS } from "./departmentManagerScope.core.mjs";

export function resolveEditorialDepartmentScope(scopeContext = {}) {
  const roleKeys = scopeContext.roleKeys || [];
  if (scopeContext.isGlobal || roleKeys.includes("superadmin")) {
    return { mode: "global", departmentId: null, departmentSlug: null, valid: true };
  }

  const isDepartmentManager = roleKeys.some((roleKey) => DEPARTMENT_MANAGER_ROLE_SLUGS[roleKey]);
  if (!isDepartmentManager) {
    return { mode: "global", departmentId: null, departmentSlug: null, valid: true };
  }

  const departmentId = scopeContext.managedDepartmentId || null;
  const departmentSlug = scopeContext.managedDepartmentSlug || null;
  return {
    mode: "department",
    departmentId,
    departmentSlug,
    valid: Boolean(departmentId && departmentSlug),
  };
}

export function canAccessEditorialRecord(scope, record = {}) {
  if (!scope?.valid) return false;
  return scope.mode === "global" || record.department_id === scope.departmentId;
}

export function scopeEditorialWritePayload(scope, payload = {}) {
  if (!scope?.valid) return null;
  if (scope.mode === "global") return { ...payload };
  return { ...payload, department_id: scope.departmentId };
}

export function canUseEditorialTeam(scope, team = {}) {
  if (!scope?.valid) return false;
  return scope.mode === "global" || team.department_id === scope.departmentId;
}

export function isAllowedEditorialCategory(scope, categoryKey) {
  if (!scope?.valid) return false;
  return scope.mode === "global" || categoryKey === scope.departmentSlug;
}
