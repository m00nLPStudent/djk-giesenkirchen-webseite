import { AUTH_ENFORCEMENT_ENABLED } from "@/lib/admin-auth/adminPermissionConfig";
import { resolveAdminRouteGuardResult } from "@/lib/admin-auth/permissionGuards";

export default function AdminRouteGuard({ children, route, userContext }) {
  const result = resolveAdminRouteGuardResult({ route, userContext });

  if (!AUTH_ENFORCEMENT_ENABLED) {
    return children;
  }

  if (result.allow) {
    return children;
  }

  // Redirects are intentionally not active in B5. This is a structural placeholder.
  return children;
}
