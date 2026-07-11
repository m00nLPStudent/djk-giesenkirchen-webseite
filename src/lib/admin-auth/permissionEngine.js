import {
  ADMIN_DASHBOARD_ACTION_PERMISSION_MAP,
  ADMIN_NAV_PERMISSION_MAP,
  ADMIN_PERMISSION_DEFAULTS,
  AUTH_ENFORCEMENT_ENABLED,
  resolveAdminRoutePermission,
} from "./adminPermissionConfig";
import { normalizeUserContext } from "./permissionFallbacks";

function resolveRoutePermission(route = "") {
  const resolution = resolveAdminRoutePermission(route || "");
  if (!resolution.matched) {
    return null;
  }

  return {
    matcher: resolution.routePattern,
    routePattern: resolution.routePattern,
    permission: resolution.permission,
    exact: resolution.matchType === "exact",
    matchType: resolution.matchType,
    priority: resolution.priority,
  };
}

export function getRequiredAdminRoutePermission(route = "") {
  return resolveRoutePermission(route)?.permission || null;
}

export function getUserPermissionKeys(userContext) {
  const normalized = normalizeUserContext(userContext);
  return Array.from(normalized.permissionSet || []);
}

export function hasPermission(userContext, permission) {
  if (!permission) return true;

  const normalized = normalizeUserContext(userContext);
  if (normalized.isSuperAdmin) return true;

  return normalized.permissionSet.has(permission);
}

export function hasAnyPermission(userContext, permissions = []) {
  if (!permissions?.length) return true;
  return permissions.some((permission) =>
    hasPermission(userContext, permission),
  );
}

export function hasAllPermissions(userContext, permissions = []) {
  if (!permissions?.length) return true;
  return permissions.every((permission) =>
    hasPermission(userContext, permission),
  );
}

export function canAccessAdminRoute(userContext, route) {
  const rule = resolveRoutePermission(route || "");

  if (!rule?.permission) {
    return ADMIN_PERMISSION_DEFAULTS.allowUnknownRoute;
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return true;
  }

  return hasPermission(userContext, rule.permission);
}

export function canSeeAdminNavItem(userContext, navItem) {
  const href = navItem?.href || "";
  const required =
    navItem?.requiredPermission || ADMIN_NAV_PERMISSION_MAP[href] || null;

  if (!required) {
    return ADMIN_PERMISSION_DEFAULTS.allowUnknownNavItem;
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return true;
  }

  return hasPermission(userContext, required);
}

export function canSeeDashboardAction(userContext, action) {
  const href = action?.href || "";
  const required =
    action?.requiredPermission ||
    ADMIN_DASHBOARD_ACTION_PERMISSION_MAP[href] ||
    null;

  if (!required) {
    return ADMIN_PERMISSION_DEFAULTS.allowUnknownDashboardAction;
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return true;
  }

  return hasPermission(userContext, required);
}
