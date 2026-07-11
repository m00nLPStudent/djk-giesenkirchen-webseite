import {
  createAdminProfile,
  fetchAdminProfileById,
} from "@/lib/admin-auth/adminProfiles.repository";
import {
  deleteAdminAuthUserById,
  inviteAdminAuthUser,
} from "@/lib/admin-auth/adminUserInvite.service";
import { getSupabaseAdminEnvStatus } from "@/lib/supabase.admin";
import {
  buildCreateFailureMessage,
  rollbackCreatedUserState,
} from "@/components/admin/users/services/usersActionCreateHelpers";
import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";
import {
  replaceUserRoleLinks,
  withRlsHint,
} from "@/components/admin/users/services/usersActionWriteHelpers";

export async function ensureEmailIsAvailable(email, supabaseServer) {
  const { data: existingProfileByEmail, error: existingProfileError } =
    await supabaseServer
      .from("admin_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

  if (existingProfileError) {
    return {
      ok: false,
      reason: isLikelyRlsError(existingProfileError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          existingProfileError,
          "E-Mail-Pruefung konnte nicht ausgefuehrt werden.",
        ),
      ),
    };
  }

  if (existingProfileByEmail?.id) {
    return {
      ok: false,
      reason: "email-exists",
      message: "E-Mail ist bereits vorhanden.",
      errors: { email: "E-Mail ist bereits vorhanden." },
    };
  }

  return { ok: true };
}

async function rollbackAuthOnlyUser(userId) {
  const cleanup = await deleteAdminAuthUserById(userId);
  return {
    profileDeleted: false,
    authUserDeleted: Boolean(cleanup?.ok),
    errors: cleanup?.ok
      ? []
      : [cleanup?.message || "Auth-Benutzer konnte nicht entfernt werden."],
  };
}

export async function createAdminUserWithInvite(payload, supabaseServer) {
  const env = getSupabaseAdminEnvStatus();
  if (!env.hasServiceRoleKey) {
    return {
      ok: false,
      reason: "missing-service-role",
      message:
        "Benutzeranlage ist noch nicht aktiviert. SUPABASE_SERVICE_ROLE_KEY fehlt.",
      requiresServiceRole: true,
    };
  }

  const emailCheck = await ensureEmailIsAvailable(
    payload.email,
    supabaseServer,
  );
  if (!emailCheck.ok) {
    return {
      ok: false,
      reason: emailCheck.reason,
      message: emailCheck.message,
      errors: emailCheck.errors,
      needsRlsWritePolicy: emailCheck.reason === "rls-blocked",
    };
  }

  const inviteResult = await inviteAdminAuthUser(payload.email);
  if (!inviteResult.ok || !inviteResult.userId) {
    return {
      ok: false,
      reason: "invite-failed",
      message:
        inviteResult.message || "Benutzer konnte nicht eingeladen werden.",
      requiresServiceRole: Boolean(inviteResult.requiresServiceRole),
    };
  }

  const userId = inviteResult.userId;

  const { error: profileError } = await createAdminProfile(
    {
      id: userId,
      full_name: payload.full_name,
      email: payload.email,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    },
    supabaseServer,
  );

  if (profileError) {
    const cleanup = await rollbackAuthOnlyUser(userId);
    return {
      ok: false,
      reason: isLikelyRlsError(profileError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: buildCreateFailureMessage(
        withRlsHint(
          formatSupabaseError(
            profileError,
            "Profil konnte nicht erstellt werden.",
          ),
        ),
        cleanup,
      ),
      needsRlsWritePolicy: isLikelyRlsError(profileError.message || ""),
      requiresManualCleanup: cleanup.errors.length > 0,
    };
  }

  const roleResult = await replaceUserRoleLinks(
    userId,
    payload,
    supabaseServer,
  );
  if (!roleResult.ok) {
    const cleanup = await rollbackCreatedUserState(userId, supabaseServer, {
      removeProfile: true,
    });

    return {
      ...roleResult,
      message: buildCreateFailureMessage(roleResult.message, cleanup),
      requiresManualCleanup: cleanup.errors.length > 0,
    };
  }

  const { data: savedProfile, error: profileReadError } =
    await fetchAdminProfileById(userId, supabaseServer);

  if (profileReadError || !savedProfile?.id) {
    const cleanup = await rollbackCreatedUserState(userId, supabaseServer, {
      removeProfile: true,
    });

    return {
      ok: false,
      reason: "write-failed",
      message: buildCreateFailureMessage(
        withRlsHint(
          formatSupabaseError(
            profileReadError,
            "Benutzer wurde erstellt, konnte aber nicht bestaetigt werden.",
          ),
        ),
        cleanup,
      ),
      requiresManualCleanup: cleanup.errors.length > 0,
    };
  }

  return {
    ok: true,
    message: `Einladung wurde erfolgreich an ${payload.email} versendet.`,
    requiresServiceRole: false,
  };
}
