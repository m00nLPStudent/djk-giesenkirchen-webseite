import "server-only";

import { buildAdminRedirectUrl } from "@/lib/admin-auth/adminAuthRedirects";
import {
  createSupabaseAdminClient,
  getSupabaseAdminEnvStatus,
} from "@/lib/supabase.admin";

function createServiceClient() {
  return createSupabaseAdminClient();
}

export async function inviteAdminAuthUser(email) {
  const env = getSupabaseAdminEnvStatus();

  if (!env.hasServiceRoleKey) {
    return {
      ok: false,
      message:
        "Benutzeranlage ist noch nicht aktiviert. SUPABASE_SERVICE_ROLE_KEY fehlt.",
      requiresServiceRole: true,
    };
  }

  if (!env.hasUrl || !env.hasAnonKey) {
    return {
      ok: false,
      message:
        "Supabase-Konfiguration unvollstaendig. NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt.",
      requiresServiceRole: false,
    };
  }

  const client = createServiceClient();

  if (!client) {
    return {
      ok: false,
      message:
        "Auth-Benutzeranlage benoetigt Service-Role-Server-Action. Noch nicht aktiv. Erforderlich: SUPABASE_SERVICE_ROLE_KEY.",
      requiresServiceRole: true,
    };
  }

  const redirectTo = buildAdminRedirectUrl("/admin/set-password");

  if (!redirectTo) {
    return {
      ok: false,
      message:
        "Redirect-URL fehlt. Bitte NEXT_PUBLIC_SITE_URL oder ADMIN_AUTH_REDIRECT_URL konfigurieren.",
      requiresServiceRole: false,
    };
  }

  const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    const text = (error.message || "").toLowerCase();
    const alreadyExists =
      text.includes("already") ||
      text.includes("exists") ||
      text.includes("registered");

    return {
      ok: false,
      message: alreadyExists
        ? "E-Mail ist bereits in Auth registriert. Bitte bestehenden Benutzer verwenden oder Passwort-Reset senden."
        : error.message || "Einladung konnte nicht gesendet werden.",
      requiresServiceRole: false,
    };
  }

  return {
    ok: true,
    userId: data?.user?.id || null,
    message: "Einladung wurde versendet.",
    requiresServiceRole: false,
  };
}

export async function deleteAdminAuthUserById(userId) {
  const env = getSupabaseAdminEnvStatus();
  if (!env.hasServiceRoleKey || !env.hasUrl) {
    return {
      ok: false,
      message:
        "Auth-Cleanup nicht moeglich: Service-Role-Server-Action ist nicht aktiv.",
      requiresServiceRole: true,
    };
  }

  const client = createServiceClient();

  if (!client) {
    return {
      ok: false,
      message:
        "Auth-Cleanup nicht moeglich: Service-Role-Server-Action ist nicht aktiv.",
      requiresServiceRole: true,
    };
  }

  if (!userId) {
    return {
      ok: false,
      message: "Auth-Cleanup nicht moeglich: Ungueltige Benutzer-ID.",
      requiresServiceRole: false,
    };
  }

  const { error } = await client.auth.admin.deleteUser(userId);
  if (error) {
    return {
      ok: false,
      message:
        error.message ||
        "Auth-Benutzer konnte waehrend Cleanup nicht geloescht werden.",
      requiresServiceRole: false,
    };
  }

  return { ok: true, message: "Auth-Benutzer wurde im Cleanup geloescht." };
}
