import {
  loadAdminPermissions,
  loadAdminRoles,
} from "@/lib/admin-auth/adminAuth.service";
import { getAdminUserCreateCapabilities } from "@/lib/admin-auth/adminUserInvite.service";
import {
  buildRlsHint,
  formatSupabaseError,
  getBrowserAuthState,
  isLikelyRlsError,
  isBrowserRuntime,
  toAdminError,
} from "@/lib/admin-auth/adminDiagnostics";
import { fetchRolePermissionsByRoleIds } from "@/lib/admin-auth/adminRoles.repository";
import { fetchAdminProfiles } from "@/lib/admin-auth/adminProfiles.repository";
import { fetchAllUserRoleLinks } from "@/lib/admin-auth/userRoles.repository";

function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function buildDisplayName(profile) {
  const explicitName = profile?.full_name || profile?.name;
  if (explicitName) return explicitName;

  const first = profile?.first_name || "";
  const last = profile?.last_name || "";
  const combined = `${first} ${last}`.trim();

  if (combined) return combined;
  return profile?.email || "Unbekannt";
}

function mapUserRole(role, link) {
  return {
    id: role.id,
    role_id: role.id,
    key: role.key,
    name: role.name,
    is_primary: Boolean(link?.is_primary),
    is_active: role.is_active,
    sort_order: role.sort_order,
  };
}

function buildPermissionIdsByRole(rolePermissions = []) {
  return rolePermissions.reduce((acc, link) => {
    if (!link?.role_id || !link?.permission_id) return acc;

    if (!acc[link.role_id]) {
      acc[link.role_id] = [];
    }

    acc[link.role_id].push(link.permission_id);
    return acc;
  }, {});
}

function enrichUser(
  profile,
  links,
  roleById,
  permissionsById,
  permissionIdsByRole,
) {
  const mappedRoles = (links || [])
    .map((link) => mapUserRole(roleById.get(link.role_id), link))
    .filter((role) => Boolean(role?.id))
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });

  const primaryRole =
    mappedRoles.find((role) => role.is_primary) || mappedRoles[0] || null;

  const permissionIds = uniqueValues(
    mappedRoles.flatMap((role) => permissionIdsByRole[role.id] || []),
  );

  const permissions = permissionIds
    .map((id) => permissionsById.get(id))
    .filter(Boolean)
    .sort((a, b) =>
      `${a.category || ""}.${a.key || ""}`.localeCompare(
        `${b.category || ""}.${b.key || ""}`,
      ),
    );

  return {
    id: profile.id,
    user_id: profile.id,
    avatar_url: profile.avatar_url || null,
    email: profile.email || "",
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    name: buildDisplayName(profile),
    is_active: profile.is_active !== false,
    created_at: profile.created_at || null,
    last_login_at: profile.last_login_at || null,
    primaryRole,
    roles: mappedRoles,
    permissions,
  };
}

export async function getAdminUsersPageData() {
  let currentUserId = null;
  let loadState = {
    status: "ready",
    authInitDone: !isBrowserRuntime(),
    hasSession: true,
    hasUser: true,
    errorCode: null,
    message: "",
  };

  if (isBrowserRuntime()) {
    const authState = await getBrowserAuthState("admin-users");
    loadState = {
      status: authState.hasSession ? "ready" : "no-session",
      authInitDone: authState.authInitDone,
      hasSession: authState.hasSession,
      hasUser: authState.hasUser,
      errorCode: authState.errorCode,
      message: authState.message,
    };

    if (!authState.hasSession) {
      return {
        users: [],
        roles: [],
        currentUserId: null,
        createCapabilities: getAdminUserCreateCapabilities(),
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          totalRoles: 0,
        },
        loadState,
      };
    }

    if (!authState.hasUser) {
      return {
        users: [],
        roles: [],
        currentUserId: null,
        createCapabilities: getAdminUserCreateCapabilities(),
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          inactiveUsers: 0,
          totalRoles: 0,
        },
        loadState: {
          ...loadState,
          status: "auth-error",
          message:
            authState.message ||
            "Session vorhanden, aber Benutzer konnte nicht geladen werden.",
        },
      };
    }

    currentUserId = authState.user?.id || null;
  }

  const [
    { data: profiles, error: profilesError },
    { data: roleLinks, error: roleLinksError },
    roles,
    permissions,
  ] = await Promise.all([
    fetchAdminProfiles(),
    fetchAllUserRoleLinks(),
    loadAdminRoles({ onlyActive: false }),
    loadAdminPermissions(),
  ]);

  if (profilesError) {
    const message = formatSupabaseError(
      profilesError,
      "admin_profiles konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-users", ["admin_profiles"]);
    }
    throw toAdminError("admin_profiles", profilesError);
  }

  if (roleLinksError) {
    const message = formatSupabaseError(
      roleLinksError,
      "admin_user_roles konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-users", ["admin_user_roles"]);
    }
    throw toAdminError("admin_user_roles", roleLinksError);
  }

  const roleById = new Map((roles || []).map((role) => [role.id, role]));
  const permissionById = new Map(
    (permissions || []).map((permission) => [permission.id, permission]),
  );

  const roleIds = uniqueValues((roles || []).map((role) => role.id));
  const { data: rolePermissions, error: rolePermissionsError } =
    await fetchRolePermissionsByRoleIds(roleIds);
  if (rolePermissionsError) {
    const message = formatSupabaseError(
      rolePermissionsError,
      "admin_role_permissions konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-users", ["admin_role_permissions"]);
    }
    throw toAdminError("admin_role_permissions", rolePermissionsError);
  }

  const permissionIdsByRole = buildPermissionIdsByRole(rolePermissions || []);

  const linksByUser = (roleLinks || []).reduce((acc, link) => {
    if (!link?.user_id) return acc;
    if (!acc[link.user_id]) acc[link.user_id] = [];
    acc[link.user_id].push(link);
    return acc;
  }, {});

  const users = (profiles || []).map((profile) =>
    enrichUser(
      profile,
      linksByUser[profile.id] || [],
      roleById,
      permissionById,
      permissionIdsByRole,
    ),
  );

  const createCapabilities = getAdminUserCreateCapabilities();

  return {
    users,
    roles: roles || [],
    currentUserId,
    createCapabilities,
    loadState,
    stats: {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.is_active).length,
      inactiveUsers: users.filter((user) => !user.is_active).length,
      totalRoles: (roles || []).length,
    },
  };
}
