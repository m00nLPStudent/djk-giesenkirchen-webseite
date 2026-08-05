import "server-only";

export async function loadAdminNotificationRecipientSource(db) {
  const [profiles, links, roles, rolePermissions, permissions] = await Promise.all([
    db.from("admin_profiles").select("id, email, is_active").eq("is_active", true),
    db.from("admin_user_roles").select("user_id, role_id"),
    db.from("admin_roles").select("id, key, is_active").eq("is_active", true),
    db.from("admin_role_permissions").select("role_id, permission_id"),
    db.from("admin_permissions").select("id, key"),
  ]);
  const error = [profiles, links, roles, rolePermissions, permissions].find((result) => result.error)?.error || null;
  return { data: error ? null : { profiles: profiles.data || [], links: links.data || [], roles: roles.data || [], rolePermissions: rolePermissions.data || [], permissions: permissions.data || [] }, error };
}

export function createAdminNotificationRecipients(source = {}) {
  const roleById = new Map((source.roles || []).map((row) => [row.id, row.key]));
  const permissionById = new Map((source.permissions || []).map((row) => [row.id, row.key]));
  const rolesByUser = new Map();
  for (const row of source.links || []) rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) || []), roleById.get(row.role_id)].filter(Boolean));
  const permissionsByRole = new Map();
  for (const row of source.rolePermissions || []) permissionsByRole.set(row.role_id, [...(permissionsByRole.get(row.role_id) || []), permissionById.get(row.permission_id)].filter(Boolean));
  const roleIdsByUser = new Map();
  for (const row of source.links || []) roleIdsByUser.set(row.user_id, [...(roleIdsByUser.get(row.user_id) || []), row.role_id]);
  return (source.profiles || []).map((profile) => ({ userId: profile.id, email: profile.email || "", roleKeys: [...new Set(rolesByUser.get(profile.id) || [])], permissionKeys: [...new Set((roleIdsByUser.get(profile.id) || []).flatMap((id) => permissionsByRole.get(id) || []))] }));
}
