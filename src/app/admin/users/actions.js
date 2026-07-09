"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminProfile,
  updateAdminProfileById,
  updateAdminProfileStatus,
} from "@/lib/admin-auth/adminProfiles.repository";
import { inviteAdminAuthUser } from "@/lib/admin-auth/adminUserInvite.service";
import { buildUserEditorPayload } from "@/components/admin/users/helpers/users.payload";
import { validateUserEditorValues } from "@/components/admin/users/helpers/users.validation";
import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";
import { createServerActionSupabaseClient } from "@/lib/supabase.server";
import {
  buildCreateFailureMessage,
  getActorContext,
  replaceUserRoleLinks,
  rollbackCreatedUserState,
  withRlsHint,
} from "@/components/admin/users/services/usersActionWriteHelpers";

export async function saveAdminUserAction({ userId, values, currentUserId }) {
  const supabaseServer = await createServerActionSupabaseClient();
  const actorContext = await getActorContext(supabaseServer);

  if (!actorContext.ok) {
    return {
      ok: false,
      reason: actorContext.reason,
      message: actorContext.message,
    };
  }

  const validation = validateUserEditorValues(values, { isCreate: !userId });

  if (!validation.isValid) {
    return {
      ok: false,
      message: "Bitte Eingaben pruefen.",
      errors: validation.errors,
    };
  }

  const payload = buildUserEditorPayload(values);

  if (
    userId &&
    currentUserId &&
    userId === currentUserId &&
    !payload.is_active
  ) {
    return {
      ok: false,
      message: "Du kannst deinen eigenen Benutzer nicht deaktivieren.",
    };
  }

  if (!userId) {
    const inviteResult = await inviteAdminAuthUser(payload.email);

    if (!inviteResult.ok || !inviteResult.userId) {
      return {
        ok: false,
        message:
          inviteResult.message || "Benutzer konnte nicht eingeladen werden.",
        requiresServiceRole: Boolean(inviteResult.requiresServiceRole),
      };
    }

    const { error: profileError } = await createAdminProfile(
      {
        id: inviteResult.userId,
        full_name: payload.full_name,
        email: payload.email,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      },
      supabaseServer,
    );

    if (profileError) {
      const cleanup = await rollbackCreatedUserState(
        inviteResult.userId,
        supabaseServer,
        {
          removeProfile: false,
        },
      );

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
      inviteResult.userId,
      payload,
      supabaseServer,
    );
    if (!roleResult.ok) {
      const cleanup = await rollbackCreatedUserState(
        inviteResult.userId,
        supabaseServer,
        {
          removeProfile: true,
        },
      );

      return {
        ...roleResult,
        message: buildCreateFailureMessage(roleResult.message, cleanup),
        requiresManualCleanup: cleanup.errors.length > 0,
      };
    }

    revalidatePath("/admin/users");
    return {
      ok: true,
      message: "Benutzer wurde eingeladen und angelegt.",
      requiresServiceRole: false,
    };
  }

  const { error: profileUpdateError } = await updateAdminProfileById(
    userId,
    {
      full_name: payload.full_name,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    },
    supabaseServer,
  );

  if (profileUpdateError) {
    return {
      ok: false,
      reason: isLikelyRlsError(profileUpdateError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          profileUpdateError,
          "Profil konnte nicht aktualisiert werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(profileUpdateError.message || ""),
    };
  }

  const roleResult = await replaceUserRoleLinks(
    userId,
    payload,
    supabaseServer,
  );
  if (!roleResult.ok) {
    return roleResult;
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "Benutzer wurde aktualisiert." };
}

export async function updateAdminUserStatusAction({
  userId,
  isActive,
  currentUserId,
}) {
  try {
    const supabaseServer = await createServerActionSupabaseClient();
    const actorContext = await getActorContext(supabaseServer);

    if (!actorContext.ok) {
      return {
        ok: false,
        reason: actorContext.reason,
        message: actorContext.message,
      };
    }

    if (!userId) {
      return { ok: false, message: "Ungueltige Benutzer-ID." };
    }

    if (currentUserId && userId === currentUserId && isActive === false) {
      return {
        ok: false,
        message: "Du kannst deinen eigenen Benutzer nicht deaktivieren.",
      };
    }

    const { error } = await updateAdminProfileStatus(
      userId,
      isActive,
      supabaseServer,
    );
    if (error) {
      return {
        ok: false,
        reason: isLikelyRlsError(error.message || "")
          ? "rls-blocked"
          : "write-failed",
        message: withRlsHint(
          formatSupabaseError(
            error,
            "Status konnte nicht aktualisiert werden.",
          ),
        ),
      };
    }

    revalidatePath("/admin/users");
    return { ok: true };
  } catch {
    return { ok: false, message: "Status konnte nicht aktualisiert werden." };
  }
}
