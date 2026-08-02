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
    .select("id")
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

    if (playerId) {
      const existingPlayer = await loadPlayerById(supabaseServer, playerId);
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

    const { error } = await savePlayer(playerPayload || {}, playerId, {
      client: supabaseServer,
      targetTeamSeasonOption: targetResolution.teamSeasonOption,
    });

    if (error) {
      return buildError(error.message || "Fehler beim Speichern.");
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

  const result = await archivePlayer(supabaseServer, playerId);

  if (result.ok) {
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
