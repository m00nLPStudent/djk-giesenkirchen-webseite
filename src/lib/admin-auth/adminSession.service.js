import { supabase } from "@/lib/supabase";
import { loadAdminAuthContext } from "./adminAuth.service";

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

export async function getCurrentAdminProfile() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return null;
    return data || null;
  } catch {
    return null;
  }
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
        profile: null,
        roles: [],
        permissions: [],
        isActive: false,
        hasAdminProfile: false,
      };
    }

    const authContext = await loadAdminAuthContext(user.id);

    return {
      session,
      user,
      profile: authContext?.profile || profile,
      roles: authContext?.roles || [],
      permissions: authContext?.permissions || [],
      permissionSet: authContext?.permissionSet || new Set(),
      isActive: Boolean(authContext?.isActive),
      hasAdminProfile: Boolean((authContext?.profile || profile)?.id),
      isSuperAdmin: Boolean(
        (authContext?.roles || []).some((role) => role?.key === "superadmin"),
      ),
    };
  } catch {
    return {
      session: null,
      user: null,
      profile: null,
      roles: [],
      permissions: [],
      permissionSet: new Set(),
      isActive: false,
      hasAdminProfile: false,
      isSuperAdmin: false,
    };
  }
}

export async function updateLastLoginAt(userId) {
  if (!userId) return { ok: false, reason: "missing-user-id" };

  try {
    const { error } = await supabase
      .from("admin_profiles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { ok: false, reason: "update-failed" };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: "unexpected-error" };
  }
}
