"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreateCoachOnServer,
  canDeleteCoachOnServer,
  canEditCoachOnServer,
  getCoachTeamIdsMap,
  loadScopedActiveTeamsForPeople,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { saveCoach } from "@/components/admin/coaches/services/coachWrite.service";
import { loadCoachCurrentSeasonAssignmentRows } from "@/components/admin/coaches/services/coachWrite.repository";
import { logNotificationFailure, notifyCoachAssignmentChange } from "@/components/admin/notifications/teamAssignmentNotifications.service";
import {
  loadScopedCoachTeamSeasonOptions,
  resolveCoachTeamSeasonTargets,
} from "@/components/admin/coaches/services/coachTeamSeasonOptions.repository";
import { revalidatePath } from "next/cache";
import { archiveCoach } from "@/components/admin/archiving/archive.service";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, resolvePublicCoachMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";

function buildError(message) {
  return { error: { message } };
}
const SAFE_MEDIA_ERRORS = new Set(["Keine Datei ausgewählt.", "Nur JPEG-, PNG-, WebP-Bilder und PDF-Dokumente sind erlaubt.", "Dateiinhalt und MIME-Typ stimmen nicht überein.", "Ungültige WebP-Datei.", "Die Datei ist leer oder größer als 10 MB."]);

function revalidatePublicCoachPages() {
  revalidatePath("/fussball/abteilung/trainer");
  revalidatePath("/trainer/[slug]", "page");
  revalidatePath("/fussball/[slug]", "page");
}

async function loadCoachById(client, coachId) {
  const { data } = await client
    .from("coaches")
    .select("*")
    .eq("id", coachId)
    .maybeSingle();

  return data || null;
}

export async function loadCoachFormTeamsAction(requiredPermission) {
  try {
    const permissionResult = await assertAdminActionPermission({
      requiredPermission,
    });

    if (!permissionResult.ok) {
      return {
        ok: false,
        message: permissionResult.message || "Berechtigung fehlt.",
        teamOptionsResult: null,
      };
    }

    const scopeContext = await loadServerPersonScopeContext(permissionResult);
    const teamOptionsResult = await loadScopedCoachTeamSeasonOptions(
      scopeContext,
      permissionResult.supabaseServer,
    );

    return { ok: true, scopeContext, teamOptionsResult };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message ||
        "Die Mannschaftsoptionen konnten nicht geladen werden.",
      teamOptionsResult: null,
    };
  }
}

export async function saveCoachWithScopeAction(coachPayload, coachId = null) {
  try {
    const requiredPermission = coachId ? "coaches.edit" : "coaches.create";
    const permissionResult = await assertAdminActionPermission({
      requiredPermission,
    });

    if (!permissionResult.ok) {
      return buildError(permissionResult.message || "Berechtigung fehlt.");
    }

    const scopeContext = await loadServerPersonScopeContext(permissionResult);
    const supabaseServer = permissionResult.supabaseServer;

    if (!coachId && !canCreateCoachOnServer(scopeContext)) {
      return buildError("Du darfst keine Trainerprofile erstellen.");
    }

    const existingCoach = coachId
      ? await loadCoachById(supabaseServer, coachId)
      : null;

    if (coachId && !existingCoach) {
      return buildError("Trainer nicht gefunden.");
    }

    if (coachId) {
      const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
        supabaseServer,
        [coachId],
      );
      const existingTeamIds = teamIdsByCoachId.get(coachId) || [];

      if (
        !canEditCoachOnServer(
          scopeContext,
          existingCoach,
          existingTeamIds,
          teamById,
        )
      ) {
        return buildError("Du darfst dieses Trainerprofil nicht bearbeiten.");
      }
    }

    const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
    const mediaResult = await resolveEntityImageMedia(coachPayload?.image_media_asset_id || null, { allowArchived: Boolean(existingCoach?.image_media_asset_id && existingCoach.image_media_asset_id === coachPayload?.image_media_asset_id), allowedVisibilities });
    if (mediaResult.error) return buildError(mediaResult.error.message);
    const safeCoachPayload = { ...coachPayload, image_media_asset_id: mediaResult.data?.id || null,
      image_url: mediaResult.data?.previewUrl || coachPayload?.image_url || null };

    const targetResolution = await resolveCoachTeamSeasonTargets(
      supabaseServer,
      safeCoachPayload.assignments || [],
    );

    if (!targetResolution.ok) {
      return buildError(
        targetResolution.message ||
          "Die Zielmannschaften konnten nicht aufgeloest werden.",
      );
    }

    const allowedTeams = await loadScopedActiveTeamsForPeople(
      scopeContext,
      supabaseServer,
    );
    const allowedTeamIds = new Set((allowedTeams || []).map((team) => team.id));
    const outOfScopeTarget = (targetResolution.teamSeasonOptions || []).find(
      (option) => !allowedTeamIds.has(option.teamId),
    );

    if (outOfScopeTarget) {
      return buildError(
        "Du darfst Trainer keinen fremden Mannschaften zuordnen.",
      );
    }

    const saveResult = await saveCoach(safeCoachPayload, coachId, {
      client: supabaseServer,
      teamSeasonOptions: targetResolution.teamSeasonOptions,
    });

    if (saveResult.error) {
      return buildError(saveResult.error.message || "Fehler beim Speichern.");
    }

    const usageResult = await synchronizeMediaAssignment("coach", saveResult.data.id, safeCoachPayload.image_media_asset_id);
    if (usageResult.error) return buildError("Die Trainerbild-Verwendung konnte nicht gespeichert werden.");

    const notificationResult = await notifyCoachAssignmentChange({
      coach: saveResult.data,
      change: saveResult.assignmentChange,
      actorUserId: permissionResult.userId,
    });
    logNotificationFailure("save-coach", notificationResult.error);

    revalidatePath("/admin/coaches");
    revalidatePublicCoachPages();
    return { error: null };
  } catch (error) {
    return buildError(
      error?.message || "Das Trainerprofil konnte nicht gespeichert werden.",
    );
  }
}

async function authorizeCoachMedia(coachId = null) {
  const requiredPermission = coachId ? "coaches.edit" : "coaches.create";
  const permissionResult = await assertAdminActionPermission({ requiredPermission });
  if (!permissionResult.ok) return { ok: false, message: permissionResult.message || "Berechtigung fehlt." };
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  if (!coachId && !canCreateCoachOnServer(scopeContext)) return { ok: false, message: "Du darfst keine Trainerprofile erstellen." };
  if (coachId) {
    const coach = await loadCoachById(permissionResult.supabaseServer, coachId);
    if (!coach) return { ok: false, message: "Trainer nicht gefunden." };
    const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(permissionResult.supabaseServer, [coachId]);
    if (!canEditCoachOnServer(scopeContext, coach, teamIdsByCoachId.get(coachId) || [], teamById)) return { ok: false, message: "Du darfst dieses Trainerprofil nicht bearbeiten." };
  }
  return { ok: true, permissionResult };
}

export async function loadCoachMediaPickerAction(filters = {}, coachId = null) {
  try {
    const auth = await authorizeCoachMedia(coachId);
    if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
    const allowedVisibilities = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
    const requestedVisibility = allowedVisibilities.includes(filters.visibility) ? filters.visibility : allowedVisibilities;
    const purpose = normalizePickerPurpose(filters.purpose, "coach");
    const result = await loadMediaLibrary({ ...filters, kind: "image", visibility: requestedVisibility, purpose, archived: "active" });
    if (result.error) return { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 };
    return { ok: true, items: result.data, total: result.count || 0 };
  } catch { return { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 }; }
}

export async function uploadCoachMediaAction(formData, coachId = null) {
  try {
    const auth = await authorizeCoachMedia(coachId);
    if (!auth.ok) return { ok: false, error: auth.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Für Trainerbilder sind nur JPEG, PNG und WebP erlaubt." };
    const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "coach" }, auth.permissionResult.profile.id);
    if (result.error) return { ok: false, error: SAFE_MEDIA_ERRORS.has(result.error.message) ? result.error.message : "Das Trainerbild konnte nicht hochgeladen werden." };
    const resolved = await resolvePublicCoachMedia(result.data.id);
    if (resolved.error) return { ok: false, error: "Das hochgeladene Bild konnte nicht geladen werden." };
    return { ok: true, item: resolved.data };
  } catch { return { ok: false, error: "Das Trainerbild konnte nicht hochgeladen werden." }; }
}

export async function removeCoachWithScopeAction(coachId) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "coaches.delete",
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const coach = await loadCoachById(supabaseServer, coachId);
  if (!coach) {
    return buildError("Trainer nicht gefunden.");
  }

  const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
    supabaseServer,
    [coachId],
  );
  const coachTeamIds = teamIdsByCoachId.get(coachId) || [];

  if (!canDeleteCoachOnServer(scopeContext, coach, coachTeamIds, teamById)) {
    return buildError("Du darfst dieses Trainerprofil nicht loeschen.");
  }

  const assignmentSnapshot = await loadCoachCurrentSeasonAssignmentRows(supabaseServer, coachId);
  const optionSnapshot = await loadScopedCoachTeamSeasonOptions(scopeContext, supabaseServer);
  const optionById = new Map((optionSnapshot.teamOptions || []).map((item) => [item.teamSeasonId, item]));
  const previousAssignments = (assignmentSnapshot.data || []).filter((item) => item.isActive !== false).map((item) => ({ ...item, ...(optionById.get(item.teamSeasonId) || {}) }));
  const result = await archiveCoach(supabaseServer, coachId);

  if (result.ok) {
    const notificationResult = await notifyCoachAssignmentChange({
      coach,
      change: { previousAssignments, nextAssignments: [], insertedIds: [], updatedIds: [], reactivatedIds: [], deactivatedIds: previousAssignments.map((item) => item.coachTeamSeasonId) },
      actorUserId: permissionResult.userId,
    });
    logNotificationFailure("archive-coach", notificationResult.error);
    revalidatePath("/admin");
    revalidatePath("/admin/coaches");
    revalidatePath(`/admin/coaches/edit/${coachId}`);
    revalidatePath("/admin/teams");
    revalidatePublicContent("coaches");
    revalidatePublicContent("teams");
    revalidatePublicContent("contacts");
  }

  return result.ok ? { error: null, ...result } : { error: { message: result.message }, ...result };
}
