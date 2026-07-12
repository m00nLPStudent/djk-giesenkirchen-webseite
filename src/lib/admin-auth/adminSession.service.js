import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { loadAdminAuthContext } from "./adminAuth.service";
import { resolveAdminProfileForAuthUser } from "./adminProfileLookup";
import {
  getBrowserAuthState,
  formatSupabaseError,
  logAdminDebugError,
  toAdminError,
} from "./adminDiagnostics";

export async function getCurrentSession() {
  const authState = await getBrowserAuthState("admin-session");
  if (!authState.hasSession) return null;
  return authState.session || null;
}

export async function getCurrentUser() {
  const authState = await getBrowserAuthState("admin-session");
  if (!authState.hasSession || !authState.hasUser) return null;
  return authState.user || null;
}

export async function getCurrentAdminProfile(userOverride = null) {
  const user = userOverride || (await getCurrentUser());
  if (!user?.id) return null;

  const supabaseBrowser = getSupabaseBrowserClient();
  const result = await resolveAdminProfileForAuthUser(supabaseBrowser, user, {
    fields: "*",
  });

  if (process.env.NODE_ENV === "development") {
    console.info("[admin-context:profile]", {
      hasAuthUser: Boolean(user?.id),
      profileFound: Boolean(result?.profile?.id),
      lookupType: result?.lookupType || null,
      fallbackUsed: Boolean(result?.fallbackUsed),
      hasQueryError: Boolean(result?.queryError),
      queryErrorCode: result?.queryError?.code || null,
      queryErrorMessage: result?.queryError?.message || null,
    });
  }

  if (result?.queryError) {
    throw toAdminError(
      `admin_profiles.by-${result.lookupType || "unknown"}`,
      result.queryError,
    );
  }

  return result?.profile || null;
}

export async function getCurrentAdminContext() {
  try {
    const authState = await getBrowserAuthState("admin-session");
    const session = authState?.hasSession ? authState.session || null : null;
    const user = authState?.hasUser ? authState.user || null : null;
    const profile = user?.id ? await getCurrentAdminProfile(user) : null;

    if (authState?.authInitDone && !authState?.hasSession) {
      return {
        session: null,
        user: null,
        userId: null,
        profile: null,
        fullName: "Admin",
        roles: [],
        primaryRole: null,
        permissions: [],
        permissionSet: new Set(),
        isActive: false,
        hasAdminProfile: false,
        isSuperAdmin: false,
        debugError: null,
      };
    }

    if (authState?.hasSession && !authState?.hasUser) {
      return {
        session,
        user: null,
        userId: null,
        profile: null,
        fullName: "Admin",
        roles: [],
        primaryRole: null,
        permissions: [],
        permissionSet: new Set(),
        isActive: false,
        hasAdminProfile: false,
        isSuperAdmin: false,
        debugError:
          authState.message ||
          "Session vorhanden, aber Benutzer konnte nicht geladen werden.",
      };
    }

    if (!user?.id) {
      return {
        session,
        user: null,
        userId: null,
        profile: null,
        fullName: "Admin",
        roles: [],
        primaryRole: null,
        permissions: [],
        permissionSet: new Set(),
        isActive: false,
        hasAdminProfile: false,
        isSuperAdmin: false,
        debugError: null,
      };
    }

    const authContext = await loadAdminAuthContext(user.id, user.email);
    const resolvedProfile = authContext?.profile || profile;
    const resolvedRoles = authContext?.roles || [];
    const primaryRole =
      authContext?.primaryRole ||
      resolvedRoles.find((role) => role?.is_primary) ||
      resolvedRoles[0] ||
      null;
    const fullName =
      resolvedProfile?.full_name ||
      resolvedProfile?.name ||
      [resolvedProfile?.first_name, resolvedProfile?.last_name]
        .filter(Boolean)
        .join(" ") ||
      user?.email ||
      "Admin";
    const profileActive =
      resolvedProfile?.is_active ?? resolvedProfile?.isActive ?? false;
    const normalizedIsActive = Boolean(profileActive);

    if (process.env.NODE_ENV === "development") {
      console.info("[admin-context] auth", {
        userId: user?.id || null,
        email: user?.email || null,
      });
      console.info("[admin-context] profile", {
        id: resolvedProfile?.id || null,
        full_name: resolvedProfile?.full_name || null,
        is_active: resolvedProfile?.is_active,
      });
      console.info(
        "[admin-context] roles.links",
        (resolvedRoles || []).map((role) => ({
          user_id: user?.id || null,
          role_id: role?.id || role?.role_id || null,
          is_primary: Boolean(role?.is_primary),
        })),
      );
      console.info(
        "[admin-context] roles.resolved",
        (resolvedRoles || []).map((role) => ({
          key: role?.key || null,
          name: role?.name || null,
          is_primary: Boolean(role?.is_primary),
        })),
      );
      console.info("[admin-context] primary-role", {
        key: primaryRole?.key || null,
        name: primaryRole?.name || null,
      });
      console.info("[admin-context] normalized", {
        hasAdminProfile: Boolean(resolvedProfile?.id),
        isActive: normalizedIsActive,
        roles: (resolvedRoles || []).length,
        primaryRole: primaryRole?.key || null,
      });
    }

    return {
      session,
      user,
      userId: user.id,
      profile: resolvedProfile,
      fullName,
      roles: resolvedRoles,
      primaryRole,
      permissions: authContext?.permissions || [],
      permissionSet: authContext?.permissionSet || new Set(),
      isActive: normalizedIsActive,
      hasAdminProfile: Boolean(resolvedProfile?.id),
      isSuperAdmin: Boolean(
        resolvedRoles.some((role) => role?.key === "superadmin"),
      ),
      debugError: null,
    };
  } catch (error) {
    logAdminDebugError("admin-context", error);
    const debugError = formatSupabaseError(
      error,
      "Admin-Kontext konnte nicht geladen werden.",
    );

    return {
      session: null,
      user: null,
      userId: null,
      profile: null,
      fullName: "Admin",
      roles: [],
      primaryRole: null,
      permissions: [],
      permissionSet: new Set(),
      isActive: false,
      hasAdminProfile: false,
      isSuperAdmin: false,
      debugError,
    };
  }
}

export async function updateLastLoginAt(userId) {
  if (!userId) return { ok: false, reason: "missing-user-id" };

  try {
    const supabaseBrowser = getSupabaseBrowserClient();
    const { error } = await supabaseBrowser
      .from("admin_profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      logAdminDebugError("update-last-login", error);
      return { ok: false, reason: "update-failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "unexpected-error" };
  }
}
