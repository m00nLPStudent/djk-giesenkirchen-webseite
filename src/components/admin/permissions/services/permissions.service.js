import {
  loadAdminPermissions,
  loadAdminRoles,
} from "@/lib/admin-auth/adminAuth.service";
import { fetchAllRolePermissionLinks } from "@/lib/admin-auth/adminPermissions.repository";

function buildLookup(items = []) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function buildCategoryGroups(permissions = []) {
  return permissions.reduce((acc, permission) => {
    const category = permission.category || "ohne-kategorie";
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {});
}

export async function getAdminPermissionsPageData() {
  const [permissions, roles, { data: links, error: linksError }] =
    await Promise.all([
      loadAdminPermissions(),
      loadAdminRoles({ onlyActive: false }),
      fetchAllRolePermissionLinks(),
    ]);

  if (linksError) throw linksError;

  const rolesById = buildLookup(roles || []);

  const rolesByPermission = (links || []).reduce((acc, link) => {
    if (!link?.permission_id || !link?.role_id) return acc;
    if (!acc[link.permission_id]) acc[link.permission_id] = [];

    const role = rolesById.get(link.role_id);
    if (role) acc[link.permission_id].push(role);

    return acc;
  }, {});

  const enrichedPermissions = (permissions || []).map((permission) => {
    const permissionRoles = rolesByPermission[permission.id] || [];

    return {
      ...permission,
      roles: permissionRoles,
      roles_count: permissionRoles.length,
    };
  });

  const unassignedPermissions = enrichedPermissions.filter(
    (permission) => !permission.roles_count,
  ).length;

  const categories = Array.from(
    new Set(enrichedPermissions.map((permission) => permission.category).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "de-DE"));

  return {
    permissions: enrichedPermissions,
    roles: roles || [],
    categories,
    stats: {
      totalPermissions: enrichedPermissions.length,
      totalCategories: categories.length,
      assignedRolePermissions: (links || []).length,
      unassignedPermissions,
    },
  };
}

export async function getPermissionMatrixPageData() {
  const [permissions, roles, { data: links, error: linksError }] =
    await Promise.all([
      loadAdminPermissions(),
      loadAdminRoles({ onlyActive: false }),
      fetchAllRolePermissionLinks(),
    ]);

  if (linksError) throw linksError;

  const grouped = buildCategoryGroups(permissions || []);

  Object.keys(grouped).forEach((category) => {
    grouped[category] = grouped[category].sort((a, b) =>
      `${a.key || ""}`.localeCompare(`${b.key || ""}`, "de-DE"),
    );
  });

  const linkSet = new Set(
    (links || []).map((link) => `${link.role_id}:${link.permission_id}`),
  );

  return {
    roles: (roles || []).sort((a, b) => {
      if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0);
      }
      return (a.name || "").localeCompare(b.name || "", "de-DE");
    }),
    permissions: permissions || [],
    groupedPermissions: grouped,
    linkSet: Array.from(linkSet),
    linkCount: (links || []).length,
  };
}
