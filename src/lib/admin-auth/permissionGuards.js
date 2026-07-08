import { AUTH_REQUIRED_FOR_ADMIN, ADMIN_AUTH_PUBLIC_ROUTES } from "./adminAuthConfig";
import { AUTH_ENFORCEMENT_ENABLED } from "./adminPermissionConfig";
import { canAccessAdminRoute } from "./permissionEngine";
import { normalizeUserContext } from "./permissionFallbacks";

function isPublicAuthRoute(route = "") {
  return ADMIN_AUTH_PUBLIC_ROUTES.some((entry) => route.startsWith(entry));
}

export function resolveAdminRouteGuardResult({ userContext, route }) {
  if (!AUTH_REQUIRED_FOR_ADMIN) {
    return { allow: true, reason: "auth-not-required" };
  }

  if (isPublicAuthRoute(route || "")) {
    return { allow: true, reason: "public-auth-route" };
  }

  const normalized = normalizeUserContext(userContext);

  if (!normalized.userId) {
    return {
      allow: false,
      reason: "missing-session",
      redirectTo: "/admin/login",
    };
  }

  if (!normalized.hasAdminProfile) {
    return {
      allow: false,
      reason: "missing-admin-profile",
      redirectTo: "/admin/unauthorized",
    };
  }

  if (!normalized.isActive) {
    return {
      allow: false,
      reason: "inactive-user",
      redirectTo: "/admin/unauthorized",
    };
  }

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return { allow: true, reason: "enforcement-disabled" };
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
