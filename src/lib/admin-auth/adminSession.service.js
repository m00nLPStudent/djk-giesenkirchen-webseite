import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { loadAdminAuthContext } from "./adminAuth.service";
import {
  formatSupabaseError,
  logAdminDebugError,
  toAdminError,
} from "./adminDiagnostics";

export async function getCurrentSession() {
  const supabaseBrowser = getSupabaseBrowserClient();
  const { data, error } = await supabaseBrowser.auth.getSession();
  if (error) {
    throw toAdminError("auth.getSession", error);
  }

  return data?.session || null;
}

export async function getCurrentUser() {
  const supabaseBrowser = getSupabaseBrowserClient();
  const { data, error } = await supabaseBrowser.auth.getUser();
  if (error) {
    throw toAdminError("auth.getUser", error);
  }

  return data?.user || null;
}

export async function getCurrentAdminProfile() {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  const supabaseBrowser = getSupabaseBrowserClient();

  const byId = await supabaseBrowser
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (byId?.error) {
    throw toAdminError("admin_profiles.by-id", byId.error);
  }

  if (byId?.data) {
    return byId.data;
  }

  if (!user?.email) {
    return null;
  }

  const byEmail = await supabaseBrowser
    .from("admin_profiles")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (byEmail?.error) {
    throw toAdminError("admin_profiles.by-email", byEmail.error);
  }

  return byEmail?.data || null;
}

export async function getCurrentAdminContext() {
  try {
    const session = await getCurrentSession();
    const user = await getCurrentUser();
    const profile = await getCurrentAdminProfile();

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
      isActive: Boolean(authContext?.isActive),
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
