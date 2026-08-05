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

function buildError(message) {
  return { error: { message } };
}

async function loadPlayerById(client, playerId) {
  const { data } = await client
    .from("players")
    .select("id, first_name, last_name, is_active")
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
    const targetResolution = await resolvePlayerTeamSeasonTarget(
      supabaseServer,
      playerPayload?.team_season_id,
    );

    if (!targetResolution.ok) {
      return buildError(
        targetResolution.message ||
          "Die Zielmannschaft konnte nicht aufgeloest werden.",
      );
    }

    const targetTeamIds = [targetResolution.teamSeasonOption.teamId];
    const targetTeamMap = new Map([
      [
        targetResolution.teamSeasonOption.team.id,
        targetResolution.teamSeasonOption.team,
      ],
    ]);

    let existingPlayer = null;
    if (playerId) {
      existingPlayer = await loadPlayerById(supabaseServer, playerId);
      if (!existingPlayer) {
        return buildError("Spieler nicht gefunden.");
      }

      const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(
        supabaseServer,
        [playerId],
      );
      const existingTeamIds = teamIdsByPlayerId.get(playerId) || [];

      if (!canEditPlayerOnServer(scopeContext, existingTeamIds, teamById)) {
        return buildError("Du darfst diesen Spieler nicht bearbeiten.");
      }

      if (
        targetTeamIds.length > 0 &&
        !canCreatePlayerOnServer(scopeContext, targetTeamIds, targetTeamMap)
      ) {
        return buildError(
          "Du darfst den Spieler keiner fremden Mannschaft zuordnen.",
        );
      }
    } else if (
      !canCreatePlayerOnServer(scopeContext, targetTeamIds, targetTeamMap)
    ) {
      return buildError(
        "Du darfst keinen Spieler fuer diese Mannschaft anlegen.",
      );
    }

    const saveResult = await savePlayer(playerPayload || {}, playerId, {
      client: supabaseServer,
      targetTeamSeasonOption: targetResolution.teamSeasonOption,
    });

    if (saveResult.error) {
      return buildError(saveResult.error.message || "Fehler beim Speichern.");
    }

    if (saveResult.assignmentChange?.previousAssignment) {
      saveResult.assignmentChange.previousAssignment = {
        ...saveResult.assignmentChange.previousAssignment,
        seasonId: targetResolution.teamSeasonOption.seasonId,
        seasonName: targetResolution.teamSeasonOption.seasonName,
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
        teamSeasonId: targetResolution.teamSeasonOption.teamSeasonId || playerPayload?.team_season_id,
        actorUserId: permissionResult.profile?.id || permissionResult.userId,
      });
      logWorkflowNotificationFailure("player-status", memberNotification.error);
    }

    revalidatePath("/admin/players");

    return { error: null };
  } catch (error) {
    return buildError(
      error?.message || "Der Spieler konnte nicht gespeichert werden.",
    );
  }
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

  if (!canDeletePlayerOnServer(scopeContext, existingTeamIds, teamById)) {
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
  const { teamIdsByPlayerId, teamById } = await getPlayerTeamIdsMap(permissionResult.supabaseServer, [playerId]);
  if (!canDeletePlayerOnServer(scopeContext, teamIdsByPlayerId.get(playerId) || [], teamById)) {
    return buildError("Du darfst diesen Spieler nicht archivieren.");
  }
  try {
    return { error: null, ...(await loadPlayerArchivePreview(permissionResult.supabaseServer, playerId)) };
  } catch {
    return buildError("Die offenen Beitraege konnten nicht geprueft werden.");
  }
}
