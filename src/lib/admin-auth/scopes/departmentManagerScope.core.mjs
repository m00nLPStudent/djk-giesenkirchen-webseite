export const DEPARTMENT_MANAGER_ROLE_SLUGS = Object.freeze({
  "fussball-vorstand": "fussball",
  "tischtennis-vorstand": "tischtennis",
});

function uniqueValues(values = []) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

export function resolveManagedDepartmentRole(roleKeys = []) {
  const normalizedRoleKeys = uniqueValues(roleKeys);

  if (normalizedRoleKeys.includes("superadmin")) {
    return { departmentSlug: null, conflict: false };
  }

  const departmentSlugs = uniqueValues(
    normalizedRoleKeys.map((roleKey) => DEPARTMENT_MANAGER_ROLE_SLUGS[roleKey]),
  );

  if (departmentSlugs.length > 1) {
    return { departmentSlug: null, conflict: true };
  }

  return {
    departmentSlug: departmentSlugs[0] || null,
    conflict: false,
  };
}

export function hasManagedDepartmentRouteMismatch(
  scopeContext = {},
  requestedDepartmentId = null,
) {
  return Boolean(
    scopeContext.managedDepartmentId
      && requestedDepartmentId
      && scopeContext.managedDepartmentId !== requestedDepartmentId,
  );
}
