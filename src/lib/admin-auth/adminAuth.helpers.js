export function isAdminProfileActive(profile) {
  return Boolean(profile?.is_active);
}

export function mapUserRoles(roleLinks = [], roles = []) {
  const roleById = new Map(roles.map((role) => [role.id, role]));

  return roleLinks
    .map((link) => ({
      ...roleById.get(link.role_id),
      role_id: link.role_id,
      is_primary: Boolean(link.is_primary),
      assigned_at: link.created_at || null,
    }))
    .filter((entry) => Boolean(entry?.role_id))
    .sort((left, right) => {
      if (left.is_primary && !right.is_primary) return -1;
      if (!left.is_primary && right.is_primary) return 1;
      return Number(left.sort_order || 0) - Number(right.sort_order || 0);
    });
}

export function uniqueValues(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function buildPermissionSet(permissions = []) {
  return new Set(
    (permissions || []).map((permission) => permission.key).filter(Boolean),
  );
}

export function hasPermission(permissionSet, permissionKey) {
  if (!permissionSet || typeof permissionSet.has !== "function") return false;
  return permissionSet.has(permissionKey);
}

export function hasAnyPermission(permissionSet, permissionKeys = []) {
  return (permissionKeys || []).some((permissionKey) =>
    hasPermission(permissionSet, permissionKey),
  );
}

export function hasAllPermissions(permissionSet, permissionKeys = []) {
  return (permissionKeys || []).every((permissionKey) =>
    hasPermission(permissionSet, permissionKey),
  );
}
