import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import {
  formatSupabaseError,
  isLikelyRlsError,
  toAdminError,
} from "@/lib/admin-auth/adminDiagnostics";
import { validateAdminPassword } from "@/lib/admin-auth/passwordPolicy";
import { buildAdminRedirectUrl } from "@/lib/admin-auth/adminAuthRedirects";
import {
  formatPermissionCount,
  formatRoleList,
} from "../helpers/profile.formatters";

export function isSuperAdmin(userContext) {
  return Boolean(
    (userContext?.roles || []).some((role) => role?.key === "superadmin"),
  );
}

export function canSeeTechnicalProfileDetails(userContext) {
  return isSuperAdmin(userContext);
}

function mapProfileData(context) {
  const roles = context?.roles || [];
  const primaryRole =
    context?.primaryRole ||
    roles.find((role) => role?.is_primary) ||
    roles[0] ||
    null;
  const additionalRoles = roles.filter((role) => role?.id !== primaryRole?.id);

  return {
    isSuperAdmin: isSuperAdmin(context),
    canSeeTechnicalDetails: canSeeTechnicalProfileDetails(context),
    userId: context?.user?.id || context?.userId || "-",
    profileId: context?.profile?.id || "-",
    fullName: context?.fullName || context?.profile?.full_name || "",
    email: context?.user?.email || context?.profile?.email || "-",
    isActive: Boolean(context?.isActive),
    primaryRole,
    additionalRoles,
    roles,
    permissions: context?.permissions || [],
    permissionCount: formatPermissionCount(context?.permissions),
    roleLabels: formatRoleList(roles),
    lastLoginAt: context?.profile?.last_login_at || null,
    createdAt: context?.profile?.created_at || null,
  };
}

export async function getOwnAdminProfileData() {
  const context = await getCurrentAdminContext();

  if (context?.debugError) {
    throw new Error(context.debugError);
  }

  if (!context?.user?.id) {
    throw new Error("Keine aktive Session gefunden.");
  }

  return mapProfileData(context);
}

export async function updateOwnProfileFullName(fullName) {
  const supabaseBrowser = getSupabaseBrowserClient();
  const context = await getCurrentAdminContext();

  if (!context?.profile?.id) {
    return {
      ok: false,
      message: "Kein Admin-Profil gefunden.",
      needsRlsUpdatePolicy: false,
    };
  }

  const payload = {
    full_name: (fullName || "").trim(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseBrowser
    .from("admin_profiles")
    .update(payload)
    .eq("id", context.profile.id);

  if (error) {
    const message = formatSupabaseError(
      error,
      "Profil konnte nicht gespeichert werden.",
    );
    return {
      ok: false,
      message,
      needsRlsUpdatePolicy: isLikelyRlsError(message),
    };
  }

  return { ok: true, message: "Profil wurde gespeichert." };
}

export async function changeOwnPassword(newPassword) {
  const supabaseBrowser = getSupabaseBrowserClient();
  const validation = validateAdminPassword(newPassword, newPassword);
  if (!validation.isValid) {
    return {
      ok: false,
      message: validation.errors[0] || "Passwortregeln nicht erfuellt.",
    };
  }

  const { error } = await supabaseBrowser.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      ok: false,
      message: formatSupabaseError(
        error,
        "Passwort konnte nicht geaendert werden.",
      ),
    };
  }

  return { ok: true, message: "Passwort wurde geaendert." };
}

export async function sendOwnPasswordResetEmail() {
  const supabaseBrowser = getSupabaseBrowserClient();
  const context = await getCurrentAdminContext();
  const email = context?.user?.email || context?.profile?.email;

  if (!email) {
    return { ok: false, message: "Keine E-Mail fuer Reset verfuegbar." };
  }

  if (typeof window === "undefined") {
    throw toAdminError("profile.security", null, "Browser-Kontext fehlt.");
  }

  const redirectTo = buildAdminRedirectUrl("/admin/set-password", {
    browserOrigin: window.location.origin,
  });
  if (!redirectTo) {
    return {
      ok: false,
      message:
        "Redirect-URL fehlt. Bitte NEXT_PUBLIC_SITE_URL oder ADMIN_AUTH_REDIRECT_URL konfigurieren.",
    };
  }

  const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return {
      ok: false,
      message: formatSupabaseError(
        error,
        "Reset-E-Mail konnte nicht gesendet werden.",
      ),
    };
  }

  return {
    ok: true,
    message: "Reset-E-Mail wurde gesendet.",
  };
}
