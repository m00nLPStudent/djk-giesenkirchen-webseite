function toUniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function hasPermission(scopeContext, permissionKey) {
  return toUniqueValues(scopeContext?.permissionKeys).includes(permissionKey);
}

function hasRole(scopeContext, roleKey) {
  return toUniqueValues(scopeContext?.roleKeys).includes(roleKey);
}

export function canViewScopedContributionStatus(scopeContext = {}) {
  if (hasPermission(scopeContext, "contributions.view")) {
    return true;
  }

  return (
    hasRole(scopeContext, "jugendleiter") ||
    hasRole(scopeContext, "jugendkoordinator") ||
    hasRole(scopeContext, "trainer")
  );
}

export function canOpenContributionDetail(scopeContext = {}) {
  return (
    hasPermission(scopeContext, "contributions.view") ||
    hasRole(scopeContext, "superadmin")
  );
}

export function getContributionStatusVisibility(scopeContext = {}) {
  if (!canViewScopedContributionStatus(scopeContext)) {
    return "none";
  }

  return canOpenContributionDetail(scopeContext) ? "full" : "scoped";
}
