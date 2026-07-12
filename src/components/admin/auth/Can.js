"use client";

import { AUTH_ENFORCEMENT_ENABLED } from "@/lib/admin-auth/adminPermissionConfig";
import { useAdminUiContext } from "./AdminUiContext";
import usePermissions from "./usePermissions";

export default function Can({
  permission,
  any,
  all,
  userContext,
  uiOnly = false,
  fallback = null,
  loadingFallback = null,
  children,
}) {
  const runtimeContext = useAdminUiContext();
  const resolvedContext = userContext || runtimeContext.userContext;
  const permissionApi = usePermissions(resolvedContext);

  if (!userContext && !runtimeContext.isReady) {
    return loadingFallback;
  }

  if (!AUTH_ENFORCEMENT_ENABLED && !uiOnly) {
    return children;
  }

  const canSingle = permission ? permissionApi.can(permission) : true;
  const canAny = any?.length ? permissionApi.canAny(any) : true;
  const canAll = all?.length ? permissionApi.canAll(all) : true;

  if (canSingle && canAny && canAll) {
    return children;
  }

  return fallback;
}
