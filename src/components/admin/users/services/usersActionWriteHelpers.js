import { deleteAdminProfileById } from "@/lib/admin-auth/adminProfiles.repository";
import {
  deleteUserRoleLinksByUserId,
  insertUserRoleLinks,
} from "@/lib/admin-auth/userRoles.repository";
import { deleteAdminAuthUserById } from "@/lib/admin-auth/adminUserInvite.service";
import { buildRoleLinksPayload } from "@/components/admin/users/helpers/users.payload";
import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";

function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export function withRlsHint(message) {
  if (!isLikelyRlsError(message || "")) return message;
  return `${message} Zum Schreiben fehlen noch die RLS-Write-Policies. Bitte admin-users-rls-write.sql ausfuehren.`;
}

export async function getActorContext(supabaseServer) {
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      reason: "no-session",
      message:
        "Keine Session in der Server Action. Bitte erneut anmelden und Vorgang wiederholen.",
    };
  }

  const { data: userRoleLinks, error: roleLinksError } = await supabaseServer
    .from("admin_user_roles")
    .select("role_id")
    .eq("user_id", user.id);

  if (roleLinksError) {
    return {
      ok: false,
      reason: "actor-check-failed",
      message: formatSupabaseError(
        roleLinksError,
        "Superadmin-Pruefung fehlgeschlagen.",
      ),
    };
  }

  const roleIds = uniqueValues(
    (userRoleLinks || []).map((link) => link.role_id),
  );

  if (!roleIds.length) {
    return {
      ok: false,
      reason: "not-superadmin",
      message: "Aktueller Benutzer ist nicht als Superadmin berechtigt.",
    };
  }

  const { data: roles, error: rolesError } = await supabaseServer
    .from("admin_roles")
    .select("id, key")
    .in("id", roleIds);

  if (rolesError) {
    return {
      ok: false,
      reason: "actor-check-failed",
      message: formatSupabaseError(
        rolesError,
        "Superadmin-Pruefung fehlgeschlagen.",
      ),
    };
  }

  const isSuperAdmin = (roles || []).some((role) => role?.key === "superadmin");
  if (!isSuperAdmin) {
    return {
      ok: false,
      reason: "not-superadmin",
      message: "Aktueller Benutzer ist nicht als Superadmin berechtigt.",
    };
  }

  return {
    ok: true,
    user,
  };
}

export async function replaceUserRoleLinks(userId, payload, supabaseServer) {
  const roleLinksPayload = buildRoleLinksPayload(userId, payload);

  const { error: deleteError } = await deleteUserRoleLinksByUserId(
    userId,
    supabaseServer,
  );
  if (deleteError) {
    return {
      ok: false,
      reason: isLikelyRlsError(deleteError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          deleteError,
          "Rollen konnten nicht aktualisiert werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(deleteError.message || ""),
    };
  }

  const { error: insertError } = await insertUserRoleLinks(
    roleLinksPayload,
    supabaseServer,
  );
  if (insertError) {
    return {
      ok: false,
      reason: isLikelyRlsError(insertError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          insertError,
          "Rollen konnten nicht gespeichert werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(insertError.message || ""),
    };
  }

  return { ok: true, needsRlsWritePolicy: false };
}

export async function rollbackCreatedUserState(
  userId,
  supabaseServer,
  { removeProfile = false } = {},
) {
  const cleanup = {
    profileDeleted: false,
    authUserDeleted: false,
    errors: [],
  };

  if (removeProfile) {
    const { error: profileDeleteError } = await deleteAdminProfileById(
      userId,
      supabaseServer,
    );
    if (profileDeleteError) {
      cleanup.errors.push(
        withRlsHint(
          formatSupabaseError(
            profileDeleteError,
            "Rollback: admin_profiles konnte nicht bereinigt werden.",
          ),
        ),
      );
    } else {
      cleanup.profileDeleted = true;
    }
  }

  const authCleanupResult = await deleteAdminAuthUserById(userId);
  if (!authCleanupResult.ok) {
    cleanup.errors.push(
      authCleanupResult.message ||
        "Rollback: Auth-Benutzer konnte nicht bereinigt werden.",
    );
  } else {
    cleanup.authUserDeleted = true;
  }

  return cleanup;
}

export function buildCreateFailureMessage(baseMessage, cleanup) {
  if (!cleanup.errors.length) {
    return `${baseMessage} Rollback erfolgreich: unvollstaendiger Benutzer wurde automatisch bereinigt.`;
  }

  return [
    baseMessage,
    "Teilzustand erkannt. Automatischer Cleanup war nicht vollstaendig.",
    "Manueller Cleanup erforderlich (Auth-Benutzer/Admin-Profil/Rollenzuordnungen pruefen).",
    `Details: ${cleanup.errors.join(" | ")}`,
  ].join(" ");
}
