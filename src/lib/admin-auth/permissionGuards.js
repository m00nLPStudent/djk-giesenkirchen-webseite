import { AUTH_ENFORCEMENT_ENABLED } from "./adminPermissionConfig";
import { canAccessAdminRoute } from "./permissionEngine";
import { normalizeUserContext } from "./permissionFallbacks";

export function resolveAdminRouteGuardResult({ userContext, route }) {
  if (!AUTH_ENFORCEMENT_ENABLED) {
    return { allow: true, reason: "enforcement-disabled" };
  }

  const normalized = normalizeUserContext(userContext);

  if (!normalized.userId) {
    return {
      allow: false,
      reason: "missing-session",
      redirectTo: "/admin/login",
    };
  }

  if (!normalized.isActive) {
    return {
      allow: false,
      reason: "inactive-user",
      redirectTo: "/admin/unauthorized",
    };
  }

  if (!canAccessAdminRoute(normalized, route)) {
    return {
      allow: false,
      reason: "missing-permission",
      redirectTo: "/admin/unauthorized",
    };
  }

  return { allow: true, reason: "authorized" };
}
