import {
  loadAdminPermissions,
  loadAdminRoles,
} from "@/lib/admin-auth/adminAuth.service";
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

function buildRoleLookup(roles = []) {
  return new Map(roles.map((role) => [role.id, role]));
}

function buildProfileLookup(profiles = []) {
  return new Map(
    profiles.map((profile) => {
      const first = profile?.first_name || "";
      const last = profile?.last_name || "";
      const fullName =
        `${first} ${last}`.trim() ||
        profile?.name ||
        profile?.email ||
        "Unbekannt";

      return [
        profile.id,
        {
          id: profile.id,
          user_id: profile.id,
          name: fullName,
          email: profile.email || "",
          is_active: profile.is_active !== false,
        },
      ];
    }),
  );
}

function buildPermissionLookup(permissions = []) {
  return new Map(permissions.map((permission) => [permission.id, permission]));
}

function groupByRoleId(links = [], valueMapper) {
  return links.reduce((acc, link) => {
    if (!link?.role_id) return acc;
    if (!acc[link.role_id]) acc[link.role_id] = [];

    const value = valueMapper(link);
    if (value) acc[link.role_id].push(value);

    return acc;
  }, {});
}

export async function getAdminRolesPageData() {
  if (!isBrowserRuntime()) {
    return {
      roles: [],
      loadState: {
        status: "auth-pending",
        authInitDone: false,
        hasSession: false,
        hasUser: false,
        errorCode: null,
        message: "Authentifizierung wird initialisiert.",
      },
      stats: {
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        assignedUserRoles: 0,
        totalPermissions: 0,
      },
    };
  }

  const authState = await getBrowserAuthState("admin-roles");
  if (!authState.hasSession) {
    return {
      roles: [],
      loadState: {
        status: "no-session",
        authInitDone: authState.authInitDone,
        hasSession: authState.hasSession,
        hasUser: authState.hasUser,
        errorCode: authState.errorCode,
        message: authState.message,
      },
      stats: {
        totalRoles: 0,
        activeRoles: 0,
        inactiveRoles: 0,
        assignedUserRoles: 0,
        totalPermissions: 0,
      },
    };
  }

  const [
    roles,
    permissions,
    { data: userRoleLinks, error: userRoleLinksError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    loadAdminRoles({ onlyActive: false }),
    loadAdminPermissions(),
    fetchAllUserRoleLinks(),
    fetchAdminProfiles(),
  ]);

  if (userRoleLinksError) {
    const message = formatSupabaseError(
      userRoleLinksError,
      "admin_user_roles konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-roles", ["admin_user_roles"]);
    }
    throw toAdminError("admin_user_roles", userRoleLinksError);
  }
  if (profilesError) {
    const message = formatSupabaseError(
      profilesError,
      "admin_profiles konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-roles", ["admin_profiles"]);
    }
    throw toAdminError("admin_profiles", profilesError);
  }

  const roleIds = (roles || []).map((role) => role.id);
  const { data: rolePermissions, error: rolePermissionsError } =
    await fetchRolePermissionsByRoleIds(roleIds);
  if (rolePermissionsError) {
    const message = formatSupabaseError(
      rolePermissionsError,
      "admin_role_permissions konnten nicht geladen werden.",
    );
    if (isLikelyRlsError(message)) {
      throw buildRlsHint("admin-roles", ["admin_role_permissions"]);
    }
    throw toAdminError("admin_role_permissions", rolePermissionsError);
  }

  const permissionsById = buildPermissionLookup(permissions || []);
  const profilesById = buildProfileLookup(profiles || []);
  const usersByRole = groupByRoleId(userRoleLinks || [], (link) =>
    profilesById.get(link.user_id),
  );
  const permissionIdsByRole = groupByRoleId(
    rolePermissions || [],
    (link) => link.permission_id,
  );

  const enrichedRoles = (roles || []).map((role) => {
    const users = (usersByRole[role.id] || []).filter(Boolean);
    const permissionIds = Array.from(
      new Set(permissionIdsByRole[role.id] || []),
    );
    const rolePermissionsList = permissionIds
      .map((permissionId) => permissionsById.get(permissionId))
      .filter(Boolean)
      .sort((a, b) =>
        `${a.category || ""}.${a.key || ""}`.localeCompare(
          `${b.category || ""}.${b.key || ""}`,
        ),
      );

    return {
      ...role,
      users,
      permissions: rolePermissionsList,
      users_count: users.length,
      permissions_count: rolePermissionsList.length,
    };
  });

  return {
    roles: enrichedRoles,
    loadState: {
      status: "ready",
      authInitDone: true,
      hasSession: true,
      hasUser: true,
      errorCode: null,
      message: "",
    },
    stats: {
      totalRoles: enrichedRoles.length,
      activeRoles: enrichedRoles.filter((role) => role.is_active).length,
      inactiveRoles: enrichedRoles.filter((role) => !role.is_active).length,
      assignedUserRoles: (userRoleLinks || []).length,
      totalPermissions: (permissions || []).length,
    },
  };
}
