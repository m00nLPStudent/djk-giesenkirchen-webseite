"use client";

import { useMemo } from "react";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  getUserPermissionKeys,
} from "@/lib/admin-auth/permissionEngine";
import { normalizeUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { createEmptyScopeContext } from "@/lib/admin-auth/scopes/scopeContext";

export default function usePermissions(userContext) {
  const context = useMemo(
    () => normalizeUserContext(userContext),
    [userContext],
  );

  const permissions = useMemo(() => getUserPermissionKeys(context), [context]);

  return {
    permissions,
    roles: context.roles,
    primaryRole: context.primaryRole,
    isActive: context.isActive,
    hasAdminProfile: context.hasAdminProfile,
    isSuperAdmin: context.isSuperAdmin,
    scopeContext: context.scopeContext || createEmptyScopeContext(),
    can: (permission) => hasPermission(context, permission),
    canAny: (requiredPermissions) =>
      hasAnyPermission(context, requiredPermissions),
    canAll: (requiredPermissions) =>
      hasAllPermissions(context, requiredPermissions),
  };
}
