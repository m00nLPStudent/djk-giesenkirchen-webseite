"use client";

import { AUTH_ENFORCEMENT_ENABLED } from "@/lib/admin-auth/adminPermissionConfig";
import usePermissions from "./usePermissions";

export default function Can({
  permission,
  any,
  all,
  userContext,
  fallback = null,
  children,
}) {
  const permissionApi = usePermissions(userContext);

  if (!AUTH_ENFORCEMENT_ENABLED) {
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
