import { createServerActionSupabaseClient } from "@/lib/supabase.server";
import { hasPermission } from "./permissionEngine";

function buildMissingPermissionResult(requiredPermission) {
  return {
    ok: false,
    reason: "missing-permission",
    permission: requiredPermission,
    message: `Fehlende Berechtigung: ${requiredPermission}.`,
  };
}

async function loadAdminProfile(supabaseServer, user) {
  const byId = await supabaseServer
    .from("admin_profiles")
    .select("id, email, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (byId?.error || byId?.data) {
    return { profile: byId?.data || null, error: byId?.error || null };
  }

  if (!user?.email) {
    return { profile: null, error: null };
  }

  const byEmail = await supabaseServer
    .from("admin_profiles")
    .select("id, email, is_active")
    .eq("email", user.email)
    .maybeSingle();

  return { profile: byEmail?.data || null, error: byEmail?.error || null };
}

async function loadPermissionContext(supabaseServer, user, profile) {
  const { data: roleLinks, error: roleLinksError } = await supabaseServer
    .from("admin_user_roles")
    .select("role_id, is_primary")
    .eq("user_id", profile.id || user.id);

  if (roleLinksError) {
    return { ok: false };
  }

  const roleIds = Array.from(
    new Set((roleLinks || []).map((row) => row?.role_id).filter(Boolean)),
  );

  if (!roleIds.length) {
    return {
      ok: true,
      context: {
        userId: user.id,
        hasAdminProfile: true,
        isActive: profile?.is_active !== false,
        roles: [],
        permissions: [],
        isSuperAdmin: false,
      },
    };
  }

  const { data: roles, error: rolesError } = await supabaseServer
    .from("admin_roles")
    .select("id, key, is_active")
    .in("id", roleIds);

  if (rolesError) {
    return { ok: false };
  }

  const resolvedRoles = (roles || []).map((role) => {
    const link = (roleLinks || []).find((row) => row.role_id === role.id);
    return {
      ...role,
      role_id: role.id,
      is_primary: Boolean(link?.is_primary),
    };
  });

  const isSuperAdmin = resolvedRoles.some((role) => role?.key === "superadmin");

  const { data: rolePermissions, error: rolePermissionsError } =
    await supabaseServer
      .from("admin_role_permissions")
      .select("permission_id")
      .in("role_id", roleIds);

  if (rolePermissionsError) {
    return { ok: false };
  }

  const permissionIds = Array.from(
    new Set(
      (rolePermissions || []).map((row) => row?.permission_id).filter(Boolean),
    ),
  );

  if (!permissionIds.length) {
    return {
      ok: true,
      context: {
        userId: user.id,
        hasAdminProfile: true,
        isActive: profile?.is_active !== false,
        roles: resolvedRoles,
        permissions: [],
        isSuperAdmin,
      },
    };
  }

  const { data: permissions, error: permissionsError } = await supabaseServer
    .from("admin_permissions")
    .select("key")
    .in("id", permissionIds);

  if (permissionsError) {
    return { ok: false };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      hasAdminProfile: true,
      isActive: profile?.is_active !== false,
      roles: resolvedRoles,
      permissions: (permissions || []).map((permission) => permission?.key),
      isSuperAdmin,
    },
  };
}

export async function assertAdminActionPermission({
  requiredPermission,
  supabaseServer: providedClient,
}) {
  const supabaseServer =
    providedClient || (await createServerActionSupabaseClient());

  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      reason: "no-session",
      message: "Keine aktive Session. Bitte erneut anmelden.",
    };
  }

  const { profile, error: profileError } = await loadAdminProfile(
    supabaseServer,
    user,
  );

  if (profileError || !profile?.id) {
    return {
      ok: false,
      reason: "missing-admin-profile",
      message: "Kein freigegebenes Admin-Profil gefunden.",
    };
  }

  if (profile.is_active === false) {
    return {
      ok: false,
      reason: "inactive-user",
      message: "Dieser Admin-Zugang ist deaktiviert.",
    };
  }

  if (!requiredPermission) {
    return { ok: true, userId: user.id, supabaseServer };
  }

  const permissionContext = await loadPermissionContext(
    supabaseServer,
    user,
    profile,
  );

  if (!permissionContext.ok) {
    return {
      ok: false,
      reason: "permission-check-failed",
      message: "Berechtigungen konnten nicht geprueft werden.",
    };
  }

  if (!hasPermission(permissionContext.context, requiredPermission)) {
    return buildMissingPermissionResult(requiredPermission);
  }

  return {
    ok: true,
    userId: user.id,
    supabaseServer,
  };
}
