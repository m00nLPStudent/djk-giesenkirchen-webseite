export function getAdminFallbackUserContext() {
  return {
    userId: null,
    isActive: true,
    hasAdminProfile: false,
    roles: [],
    permissions: [],
    permissionSet: new Set(),
    isSuperAdmin: false,
    source: "fallback",
  };
}

export function normalizeUserContext(userContext) {
  if (!userContext) {
    return getAdminFallbackUserContext();
  }

  const roles = userContext.roles || [];

  const permissionKeys = (userContext.permissions || []).map((permission) =>
    typeof permission === "string" ? permission : permission?.key,
  );

  const derivedUserId =
    userContext.userId ||
    userContext.user_id ||
    userContext.user?.id ||
    userContext.profile?.id ||
    null;

  const hasAdminProfile = Boolean(
    userContext.hasAdminProfile || userContext.profile?.id,
  );

  const resolvedIsActive =
    typeof userContext.isActive === "boolean"
      ? userContext.isActive
      : hasAdminProfile
        ? userContext.profile?.is_active !== false
        : true;

  return {
    userId: derivedUserId,
    isActive: resolvedIsActive,
    hasAdminProfile,
    roles,
    primaryRole:
      userContext.primaryRole ||
      roles.find((role) => role?.is_primary) ||
      roles[0] ||
      null,
    permissions: userContext.permissions || [],
    permissionSet: new Set((permissionKeys || []).filter(Boolean)),
    isSuperAdmin: Boolean(
      userContext.isSuperAdmin ||
      roles.some((role) => role?.key === "superadmin"),
    ),
    source: userContext.source || "runtime",
  };
}
