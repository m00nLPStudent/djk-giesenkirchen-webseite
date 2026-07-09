import { createClient } from "@supabase/supabase-js";

export function hasServiceRoleSupport() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getAdminUserCreateCapabilities() {
  const serviceRoleEnabled = hasServiceRoleSupport();

  return {
    serviceRoleEnabled,
    createFlowEnabled: serviceRoleEnabled,
  };
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function inviteAdminAuthUser(email) {
  const client = createServiceClient();

  if (!client) {
    return {
      ok: false,
      message:
        "Auth-Benutzeranlage benoetigt Service-Role-Server-Action. Noch nicht aktiv. Erforderlich: SUPABASE_SERVICE_ROLE_KEY.",
      requiresServiceRole: true,
    };
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/login`;

  const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Einladung konnte nicht gesendet werden.",
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
