"use server";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canCreatePlayerOnServer,
  canDeletePlayerOnServer,
  canEditPlayerOnServer,
  getPlayerTeamIdsMap,
  loadScopedActiveTeamsForPeople,
  loadServerPersonScopeContext,
} from "@/components/admin/persons/serverPersonScope";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import {
  loadScopedPlayerTeamSeasonOptions,
  resolvePlayerTeamSeasonTarget,
} from "@/components/admin/players/services/playerTeamSeasonOptions.repository";
import { savePlayer } from "@/components/admin/players/services/playerWrite.service";
import { loadPlayerCurrentSeasonAssignmentRows } from "@/components/admin/players/services/playerWrite.repository";
import { notifyPlayerAssignmentChange, logNotificationFailure } from "@/components/admin/notifications/teamAssignmentNotifications.service";
import { notifyMemberStatusWorkflow, logWorkflowNotificationFailure } from "@/components/admin/notifications/workflowNotifications.service";
import {
  archivePlayer,
  loadPlayerArchivePreview,
} from "@/components/admin/archiving/archive.service";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";
import { revalidatePath } from "next/cache";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
const SAFE_MEDIA_ERRORS = new Set(["Keine Datei ausgewählt.", "Nur JPEG-, PNG-, WebP-Bilder und PDF-Dokumente sind erlaubt.", "Dateiinhalt und MIME-Typ stimmen nicht überein.", "Ungültige WebP-Datei.", "Die Datei ist leer oder größer als 10 MB."]);

function buildError(message) {
  return { error: { message } };
}

async function loadPlayerById(client, playerId) {
  const { data } = await client
    .from("players")
    .select("id, first_name, last_name, is_active, department_id, image_media_asset_id, shirt_number, position_de, position_en, strong_foot, strong_hand")
    .eq("id", playerId)
    .maybeSingle();

  return data || null;
}

export async function loadPlayerFormTeamsAction(requiredPermission) {
  try {
    const permissionResult = await assertAdminActionPermission({
      requiredPermission,
    });

    if (!permissionResult.ok) {
      return {
        ok: false,
        message: permissionResult.message || "Berechtigung fehlt.",
        teams: [],
      };
    }

    const scopeContext = await loadServerPersonScopeContext(permissionResult);
    const teams = await loadScopedActiveTeamsForPeople(
      scopeContext,
      permissionResult.supabaseServer,
    );
    const teamOptionsResult = await loadScopedPlayerTeamSeasonOptions(
      scopeContext,
      permissionResult.supabaseServer,
    );

    return { ok: true, teams, scopeContext, teamOptionsResult };
  } catch (error) {
    return {
      ok: false,
      message:
        error?.message ||
        "Die Mannschaftsoptionen konnten nicht geladen werden.",
      teams: [],
      teamOptionsResult: null,
    };
  }
}

export async function savePlayerWithScopeAction(
  playerPayload,
  playerId = null,
  mutationContext = {},
) {
  try {
    const requiredPermission = playerId ? "players.edit" : "players.create";
    const permissionResult = await assertAdminActionPermission({
      requiredPermission,
    });

    if (!permissionResult.ok) {
      return buildError(permissionResult.message || "Berechtigung fehlt.");
    }

    const scopeContext = await loadServerPersonScopeContext(permissionResult);
    const supabaseServer = permissionResult.supabaseServer;
    let existingPlayer = null;
    if (playerId) existingPlayer = await loadPlayerById(supabaseServer, playerId);
    const allowedVisibilities = canManageMedia(permissionResult.roles) ? ["public", "admin"] : ["public"];
    const mediaResult = await resolveEntityImageMedia(playerPayload?.image_media_asset_id || null, { allowArchived: Boolean(existingPlayer?.image_media_asset_id && existingPlayer.image_media_asset_id === playerPayload?.image_media_asset_id), allowedVisibilities });
    if (mediaResult.error) return buildError(mediaResult.error.message);
    const expectedDepartmentSlug = ["fussball", "tischtennis"].includes(mutationContext?.departmentSlug) ? mutationContext.departmentSlug : null;
    const { data: routeDepartment } = expectedDepartmentSlug
      ? await supabaseServer.from("departments").select("id, slug").eq("slug", expectedDepartmentSlug).eq("is_active", true).maybeSingle()
      : { data: null };
    if (expectedDepartmentSlug && !routeDepartment?.id) return buildError("Die Abteilung des aktuellen Bereichs konnte nicht aufgelöst werden.");
    const safePlayerPayload = { ...playerPayload, department_id: routeDepartment?.id || existingPlayer?.department_id || null, image_media_asset_id: mediaResult.data?.id || null, image_url: mediaResult.data?.previewUrl || playerPayload?.image_url || null };
    const targetResolution = safePlayerPayload.team_season_id
      ? await resolvePlayerTeamSeasonTarget(supabaseServer, safePlayerPayload.team_season_id)
      : { ok: true, teamSeasonOption: null };

    if (!targetResolution.ok) {
      return buildError(
        targetResolution.message ||
          "Die Zielmannschaft konnte nicht aufgeloest werden.",
      );
    }

    const targetTeamIds = targetResolution.teamSeasonOption ? [targetResolution.teamSeasonOption.teamId] : [];
    const targetTeamMap = targetResolution.teamSeasonOption ? new Map([[targetResolution.teamSeasonOption.team.id, targetResolution.teamSeasonOption.team]]) : new Map();
    const relation = targetResolution.teamSeasonOption?.team?.departments;
    const targetDepartmentSlug = Array.isArray(relation) ? relation[0]?.slug : relation?.slug;
    if (!routeDepartment && targetResolution.teamSeasonOption?.team?.department_id) safePlayerPayload.department_id = targetResolution.teamSeasonOption.team.department_id;
    if (expectedDepartmentSlug && targetResolution.teamSeasonOption && targetDepartmentSlug !== expectedDepartmentSlug) return buildError("Die gewählte Mannschaft gehört nicht zum aktuellen Bereich.");
    const isTableTennis = expectedDepartmentSlug === "tischtennis" || targetDepartmentSlug === "tischtennis";
    if (isTableTennis && !["Rechts", "Links"].includes(safePlayerPayload.strong_hand)) return buildError("Bitte eine gültige starke Hand auswählen.");
    const unchanged = (field) => playerId && (safePlayerPayload[field] ?? null) === (existingPlayer?.[field] ?? null);
    const hasValue = (field) => safePlayerPayload[field] != null && String(safePlayerPayload[field]).trim() !== "";
    if (isTableTennis && ["shirt_number", "position_de", "position_en", "strong_foot"].some((field) => hasValue(field) && !unchanged(field))) return buildError("Fußballspezifische Spielerfelder sind im Tischtennis nicht zulässig.");
    if (!isTableTennis && safePlayerPayload.strong_hand && !unchanged("strong_hand")) return buildError("Die starke Hand ist ausschließlich für Tischtennis vorgesehen.");
    if (!canCreatePlayerOnServer(scopeContext, targetTeamIds, targetTeamMap)) {
      return buildError(playerId
        ? "Du darfst den Spieler keiner fremden Mannschaft zuordnen."
        : "Du darfst keinen Spieler fuer diese Mannschaft anlegen.");
    }
    const writeClient = createSupabaseAdminClient();
    if (!writeClient) return buildError("Serverseitiger Datenbankzugriff ist nicht konfiguriert.");
    const activeSeasonId = targetResolution.teamSeasonOption?.seasonId || (playerId
      ? (await loadCurrentSeasonResolution(writeClient)).activeSeasonId
      : null);

    if (playerId) {
      if (!existingPlayer) {
        return buildError("Spieler nicht gefunden.");
      }

      const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(
        writeClient,
        [playerId],
      );
      const existingTeamIds = teamIdsByPlayerId.get(playerId) || [];

      if (!canEditPlayerOnServer(scopeContext, existingTeamIds, teamById, existingPlayer)) {
        return buildError("Du darfst diesen Spieler nicht bearbeiten.");
      }

    }

    const saveResult = await savePlayer(safePlayerPayload, playerId, {
      client: writeClient,
      targetTeamSeasonOption: targetResolution.teamSeasonOption,
      activeSeasonId,
    });

    if (saveResult.error) {
      return buildError(saveResult.error.message || "Fehler beim Speichern.");
    }

    const usageResult = await synchronizeMediaAssignment("player", saveResult.data.id, safePlayerPayload.image_media_asset_id);
    if (usageResult.error) return buildError("Die Spielerbild-Verwendung konnte nicht gespeichert werden.");

    if (saveResult.assignmentChange?.previousAssignment) {
      saveResult.assignmentChange.previousAssignment = {
        ...saveResult.assignmentChange.previousAssignment,
        seasonId: activeSeasonId,
        seasonName: targetResolution.teamSeasonOption?.seasonName || null,
      };
    }
    const notificationResult = await notifyPlayerAssignmentChange({
      player: saveResult.data,
      change: saveResult.assignmentChange,
      actorUserId: permissionResult.userId,
    });
    logNotificationFailure("save-player", notificationResult.error);
    if (existingPlayer && typeof playerPayload?.is_active === "boolean" && existingPlayer.is_active !== playerPayload.is_active) {
      const memberNotification = await notifyMemberStatusWorkflow({
        type: playerPayload.is_active ? "member_activated" : "member_deactivated",
        player: saveResult.data || existingPlayer,
        teamSeasonId: targetResolution.teamSeasonOption?.teamSeasonId || playerPayload?.team_season_id,
        actorUserId: permissionResult.profile?.id || permissionResult.userId,
      });
      logWorkflowNotificationFailure("player-status", memberNotification.error);
    }

    revalidatePath("/admin/players");

    return { error: null };
  } catch (error) {
    console.error("[save-player]", { code: error?.code || "UNEXPECTED_PLAYER_SAVE_ERROR", message: error?.message || "Unbekannter Fehler" });
    return buildError("Der Spieler konnte nicht gespeichert werden. Bitte versuche es erneut.");
  }
}

async function authorizePlayerMedia(playerId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: playerId ? "players.edit" : "players.create" });
  if (!permissionResult.ok) return { ok: false, message: permissionResult.message || "Berechtigung fehlt." };
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  if (playerId) {
    const player = await loadPlayerById(permissionResult.supabaseServer, playerId);
    if (!player) return { ok: false, message: "Spieler nicht gefunden." };
    const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(permissionResult.supabaseServer, [playerId]);
    if (!canEditPlayerOnServer(scopeContext, teamIdsByPlayerId.get(playerId) || [], teamById, player)) return { ok: false, message: "Du darfst diesen Spieler nicht bearbeiten." };
  }
  return { ok: true, permissionResult };
}

export async function loadPlayerMediaPickerAction(filters = {}, playerId = null) {
  try {
    const auth = await authorizePlayerMedia(playerId);
    if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
    const allowedVisibilities = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
    const visibility = allowedVisibilities.includes(filters.visibility) ? filters.visibility : allowedVisibilities;
    const purpose = normalizePickerPurpose(filters.purpose, "player");
    const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
    return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
  } catch { return { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 }; }
}

export async function uploadPlayerMediaAction(formData, playerId = null) {
  try {
    const auth = await authorizePlayerMedia(playerId);
    if (!auth.ok) return { ok: false, error: auth.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Für Spielerbilder sind nur JPEG, PNG und WebP erlaubt." };
    const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "player" }, auth.permissionResult.profile.id);
    if (result.error) return { ok: false, error: SAFE_MEDIA_ERRORS.has(result.error.message) ? result.error.message : "Das Spielerbild konnte nicht hochgeladen werden." };
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "player" });
    return resolved.error ? { ok: false, error: "Das hochgeladene Bild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
  } catch { return { ok: false, error: "Das Spielerbild konnte nicht hochgeladen werden." }; }
}

export async function removePlayerWithScopeAction(playerId) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.delete",
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;

  const existingPlayer = await loadPlayerById(supabaseServer, playerId);
  if (!existingPlayer) {
    return buildError("Spieler nicht gefunden.");
  }

  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(
    supabaseServer,
    [playerId],
  );
  const existingTeamIds = teamIdsByPlayerId.get(playerId) || [];

  if (!canDeletePlayerOnServer(scopeContext, existingTeamIds, teamById, existingPlayer)) {
    return buildError("Du darfst diesen Spieler nicht archivieren.");
  }

  const seasonResolution = await import("@/components/admin/persons/currentSeasonRepository").then(({ loadCurrentSeasonResolution }) => loadCurrentSeasonResolution(supabaseServer));
  const assignmentSnapshot = seasonResolution.activeSeasonId
    ? await loadPlayerCurrentSeasonAssignmentRows(supabaseServer, playerId, seasonResolution.activeSeasonId)
    : { data: [] };
  const result = await archivePlayer(supabaseServer, playerId);

  if (result.ok) {
    const previousAssignment = (assignmentSnapshot.data || []).find((item) => item.isActive !== false) || null;
    if (previousAssignment) {
      const notificationResult = await notifyMemberStatusWorkflow({ type: "member_archived", player: existingPlayer, teamSeasonId: previousAssignment.teamSeasonId, actorUserId: permissionResult.profile?.id || permissionResult.userId, detailOnly: true });
      logWorkflowNotificationFailure("archive-player", notificationResult.error);
    }
    revalidatePath("/admin/players");
    revalidatePath(`/admin/players/${playerId}`);
    revalidatePath("/admin/teams");
    revalidatePath("/admin/contributions");
    revalidatePublicContent("teams");
  }

  return result.ok ? { error: null, ...result } : { error: { message: result.message }, ...result };
}

export async function loadPlayerArchivePreviewAction(playerId) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission: "players.delete",
  });
  if (!permissionResult.ok) return buildError(permissionResult.message || "Berechtigung fehlt.");
  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const player = await loadPlayerById(permissionResult.supabaseServer, playerId);
  if (!player) return buildError("Spieler nicht gefunden.");
  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(permissionResult.supabaseServer, [playerId]);
  if (!canDeletePlayerOnServer(scopeContext, teamIdsByPlayerId.get(playerId) || [], teamById, player)) {
    return buildError("Du darfst diesen Spieler nicht archivieren.");
  }
  try {
    return { error: null, ...(await loadPlayerArchivePreview(permissionResult.supabaseServer, playerId)) };
  } catch {
    return buildError("Die offenen Beitraege konnten nicht geprueft werden.");
  }
}
