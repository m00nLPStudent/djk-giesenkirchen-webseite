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
  replaceUserRoleLinks,
  validateSelfSuperadminRoleChange,
  withRlsHint,
} from "@/components/admin/users/services/usersActionWriteHelpers";
import { createAdminUserWithInvite } from "@/lib/admin-auth/adminUserCreate.service";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { previewProfileCardEmailMatches } from "@/lib/admin-auth/profileCardLinkMatching.service";
import { applyCardLinkChanges } from "./actions.cardLinks";

export async function saveAdminUserAction({ userId, values, currentUserId }) {
  const supabaseServer = await createServerActionSupabaseClient();
  const requiredPermission = userId ? "users.edit" : "users.create";
  const actorContext = await assertAdminActionPermission({
    requiredPermission,
    supabaseServer,
  });

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
  const hasBoardIntent = Object.prototype.hasOwnProperty.call(
    payload,
    "linked_board_member_id",
  );
  const hasCoachIntent = Object.prototype.hasOwnProperty.call(
    payload,
    "linked_coach_id",
  );
  const managesCardLinks = hasBoardIntent || hasCoachIntent;

  if (
    userId &&
    actorContext.userId &&
    userId === actorContext.userId &&
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
    currentUserId: actorContext.userId || currentUserId,
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
    const linkResult = await applyCardLinkChanges({
      branch: "profile-unchanged",
      userId,
      payload,
      hasBoardIntent,
      hasCoachIntent,
      managesCardLinks,
      supabaseServer,
    });

    if (!linkResult.ok) {
      return linkResult;
    }

    revalidatePath("/admin/users");
    return {
      ok: true,
      message:
        roleResult.changed || managesCardLinks
          ? "Benutzerdaten wurden aktualisiert."
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

  const linkResult = await applyCardLinkChanges({
    branch: "profile-updated",
    userId,
    payload,
    hasBoardIntent,
    hasCoachIntent,
    managesCardLinks,
    supabaseServer,
  });

  if (!linkResult.ok) {
    return linkResult;
  }

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: roleResult.changed
      ? "Benutzer und Rollen wurden aktualisiert."
      : "Benutzer wurde aktualisiert.",
  };
}

export async function previewProfileCardEmailMatchesAction({ adminProfileId }) {
  const supabaseServer = await createServerActionSupabaseClient();
  const actorContext = await assertAdminActionPermission({
    requiredPermission: "users.edit",
    supabaseServer,
  });

  if (!actorContext.ok) {
    return {
      ok: false,
      reason: actorContext.reason,
      message: actorContext.message,
    };
  }

  const superadminActor = await getActorContext(supabaseServer);
  if (!superadminActor.ok) {
    return {
      ok: false,
      reason: superadminActor.reason,
      message:
        superadminActor.message ||
        "Nur Superadmin darf Zuordnungsvorschlaege abrufen.",
    };
  }

  const preview = await previewProfileCardEmailMatches(
    adminProfileId,
    supabaseServer,
  );

  if (!preview.ok) {
    return preview;
  }

  return {
    ok: true,
    profileEmailMasked: preview.profileEmailMasked,
    duplicateProfileWarning: preview.duplicateProfileWarning,
    board: preview.board,
    coach: preview.coach,
  };
}

export async function updateAdminUserStatusAction({ userId, isActive }) {
  try {
    const supabaseServer = await createServerActionSupabaseClient();
    const actorContext = await assertAdminActionPermission({
      requiredPermission: "users.edit",
      supabaseServer,
    });

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

    if (
      actorContext.userId &&
      userId === actorContext.userId &&
      isActive === false
    ) {
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
