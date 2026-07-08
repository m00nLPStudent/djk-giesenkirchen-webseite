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

  const permissionKeys = (userContext.permissions || []).map((permission) =>
    typeof permission === "string" ? permission : permission?.key,
  );

  return {
    userId: userContext.userId || userContext.user_id || null,
    isActive: userContext.isActive !== false,
    hasAdminProfile: Boolean(
      userContext.hasAdminProfile || userContext.profile?.id,
    ),
    roles: userContext.roles || [],
    permissions: userContext.permissions || [],
    permissionSet: new Set((permissionKeys || []).filter(Boolean)),
    isSuperAdmin: Boolean(
      userContext.isSuperAdmin ||
      (userContext.roles || []).some((role) => role?.key === "superadmin"),
    ),
    source: userContext.source || "runtime",
  };
}
