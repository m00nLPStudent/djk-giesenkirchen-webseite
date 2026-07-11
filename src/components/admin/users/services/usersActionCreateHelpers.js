import { deleteAdminProfileById } from "@/lib/admin-auth/adminProfiles.repository";
import { deleteAdminAuthUserById } from "@/lib/admin-auth/adminUserInvite.service";
import { formatSupabaseError } from "@/lib/admin-auth/adminDiagnostics";
import { withRlsHint } from "./usersActionWriteHelpers";

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
