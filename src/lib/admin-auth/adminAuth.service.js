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
import { toAdminError } from "./adminDiagnostics";

function throwIfError(error, scope) {
  if (error) {
    throw toAdminError(scope, error);
  }
}

export async function loadAdminProfile(userId, email) {
  const { data, error } = await fetchAdminProfile(userId, email);
  throwIfError(error, "loadAdminProfile");
  return data;
}

export async function loadAdminRoles(options = {}) {
  const { data, error } = await fetchAdminRoles(options);
  throwIfError(error, "loadAdminRoles");
  return data || [];
}

export async function loadAdminPermissions(options = {}) {
  const { data, error } = await fetchAdminPermissions(options);
  throwIfError(error, "loadAdminPermissions");
  return data || [];
}

export async function loadUserRoles(userId) {
  const { data: roleLinks, error: roleLinksError } =
    await fetchUserRoleLinks(userId);
  throwIfError(roleLinksError, "loadUserRoles.roleLinks");

  const roleIds = uniqueValues((roleLinks || []).map((row) => row.role_id));
  const { data: roles, error: rolesError } = await fetchRolesByIds(roleIds);
  throwIfError(rolesError, "loadUserRoles.roles");

  return mapUserRoles(roleLinks || [], roles || []);
}

export async function loadUserPermissions(userId) {
  const userRoles = await loadUserRoles(userId);
  const roleIds = uniqueValues(
    userRoles.map((role) => role.role_id || role.id),
  );

  const { data: rolePermissions, error: rolePermissionsError } =
    await fetchRolePermissionsByRoleIds(roleIds);
  throwIfError(rolePermissionsError, "loadUserPermissions.rolePermissions");

  const permissionIds = uniqueValues(
    (rolePermissions || []).map((row) => row.permission_id),
  );
  const { data: permissions, error: permissionsError } =
    await fetchPermissionsByIds(permissionIds);
  throwIfError(permissionsError, "loadUserPermissions.permissions");

  return permissions || [];
}

export async function isUserActive(userId) {
  const profile = await loadAdminProfile(userId);
  return isAdminProfileActive(profile);
}

export async function loadAdminAuthContext(userId, userEmail) {
  const profile = await loadAdminProfile(userId, userEmail);
  const roles = await loadUserRoles(userId);
  const permissions = await loadUserPermissions(userId);
  const primaryRole =
    roles.find((role) => role?.is_primary) || roles[0] || null;

  return {
    userId: userId || profile?.id || null,
    profile,
    roles,
    primaryRole,
    permissions,
    permissionSet: buildPermissionSet(permissions),
    isActive: isAdminProfileActive(profile),
  };
}
