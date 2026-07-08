"use client";

import { useMemo } from "react";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  getUserPermissionKeys,
} from "@/lib/admin-auth/permissionEngine";
import { normalizeUserContext } from "@/lib/admin-auth/permissionFallbacks";

export default function usePermissions(userContext) {
  const context = useMemo(
    () => normalizeUserContext(userContext),
    [userContext],
  );

  const permissions = useMemo(() => getUserPermissionKeys(context), [context]);

  return {
    permissions,
    roles: context.roles,
    isActive: context.isActive,
    isSuperAdmin: context.isSuperAdmin,
    can: (permission) => hasPermission(context, permission),
    canAny: (requiredPermissions) =>
      hasAnyPermission(context, requiredPermissions),
    canAll: (requiredPermissions) =>
      hasAllPermissions(context, requiredPermissions),
  };
}
