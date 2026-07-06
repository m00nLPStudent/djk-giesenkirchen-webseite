import {
  fetchAdminPermissions,
  fetchAdminProfile,
  fetchAdminRoles,
  fetchPermissionsByIds,
  fetchRolePermissionsByRoleIds,
  fetchRolesByIds,
  fetchUserRoleLinks,
} from "./adminRoles.repository";
import {
  buildPermissionSet,
  isAdminProfileActive,
  mapUserRoles,
  uniqueValues,
} from "./adminAuth.helpers";

function throwIfError(error) {
  if (error) {
    throw error;
  }
}

export async function loadAdminProfile(userId) {
  const { data, error } = await fetchAdminProfile(userId);
  throwIfError(error);
  return data;
}

export async function loadAdminRoles(options = {}) {
  const { data, error } = await fetchAdminRoles(options);
  throwIfError(error);
  return data || [];
}

export async function loadAdminPermissions(options = {}) {
  const { data, error } = await fetchAdminPermissions(options);
  throwIfError(error);
  return data || [];
}

export async function loadUserRoles(userId) {
  const { data: roleLinks, error: roleLinksError } = await fetchUserRoleLinks(userId);
  throwIfError(roleLinksError);

  const roleIds = uniqueValues((roleLinks || []).map((row) => row.role_id));
  const { data: roles, error: rolesError } = await fetchRolesByIds(roleIds);
  throwIfError(rolesError);

  return mapUserRoles(roleLinks || [], roles || []);
}

export async function loadUserPermissions(userId) {
  const userRoles = await loadUserRoles(userId);
  const roleIds = uniqueValues(userRoles.map((role) => role.role_id || role.id));

  const { data: rolePermissions, error: rolePermissionsError } = await fetchRolePermissionsByRoleIds(roleIds);
  throwIfError(rolePermissionsError);

  const permissionIds = uniqueValues((rolePermissions || []).map((row) => row.permission_id));
  const { data: permissions, error: permissionsError } = await fetchPermissionsByIds(permissionIds);
  throwIfError(permissionsError);

  return permissions || [];
}

export async function isUserActive(userId) {
  const profile = await loadAdminProfile(userId);
  return isAdminProfileActive(profile);
}

export async function loadAdminAuthContext(userId) {
  const profile = await loadAdminProfile(userId);
  const roles = await loadUserRoles(userId);
  const permissions = await loadUserPermissions(userId);

  return {
    profile,
    roles,
    permissions,
    permissionSet: buildPermissionSet(permissions),
    isActive: isAdminProfileActive(profile),
  };
}
