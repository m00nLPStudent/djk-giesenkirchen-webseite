"use server";

import { revalidatePath } from "next/cache";
import {
  fetchAdminProfileById,
  updateAdminProfileById,
  updateAdminProfileStatus,
} from "@/lib/admin-auth/adminProfiles.repository";
import { buildUserEditorPayload } from "@/components/admin/users/helpers/users.payload";
import { validateUserEditorValues } from "@/components/admin/users/helpers/users.validation";
import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";
import { createServerActionSupabaseClient } from "@/lib/supabase.server";
import {
  getActorContext,
  replaceUserRoleLinks,
  validateSelfSuperadminRoleChange,
  withRlsHint,
} from "@/components/admin/users/services/usersActionWriteHelpers";
import { createAdminUserWithInvite } from "@/lib/admin-auth/adminUserCreate.service";

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
    const createResult = await createAdminUserWithInvite(
      payload,
      supabaseServer,
    );

    if (!createResult.ok) {
      return createResult;
    }

    revalidatePath("/admin/users");
    return {
      ok: true,
      message: createResult.message,
      requiresServiceRole: false,
    };
  }

  const selfSuperadminValidation = await validateSelfSuperadminRoleChange({
    userId,
    currentUserId,
    payload,
    supabaseServer,
  });

  if (!selfSuperadminValidation.ok) {
    return {
      ok: false,
      reason: selfSuperadminValidation.reason,
      message: selfSuperadminValidation.message,
      errors: selfSuperadminValidation.errors,
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

  const { data: existingProfile, error: profileReadError } =
    await fetchAdminProfileById(userId, supabaseServer);

  if (profileReadError) {
    return {
      ok: false,
      reason: isLikelyRlsError(profileReadError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          profileReadError,
          "Profil konnte nicht gelesen werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(profileReadError.message || ""),
    };
  }

  const profileNeedsUpdate = Boolean(
    !existingProfile ||
    (existingProfile.full_name || "") !== payload.full_name ||
    Boolean(existingProfile.is_active !== false) !== payload.is_active,
  );

  if (!profileNeedsUpdate) {
    revalidatePath("/admin/users");
    return {
      ok: true,
      message: roleResult.changed
        ? "Benutzerrollen wurden aktualisiert."
        : "Keine Aenderungen erkannt.",
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

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: roleResult.changed
      ? "Benutzer und Rollen wurden aktualisiert."
      : "Benutzer wurde aktualisiert.",
  };
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
