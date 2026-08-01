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
import { savePlayer } from "@/components/admin/players/services/players.service";
import { revalidatePath } from "next/cache";

function buildError(message) {
  return { error: { message } };
}

function normalizeTargetTeamIds(payload = {}) {
  return Array.from(new Set([payload?.team_id].filter(Boolean)));
}

async function loadPlayerById(client, playerId) {
  const { data } = await client
    .from("players")
    .select("*")
    .eq("id", playerId)
    .maybeSingle();

  return data || null;
}

export async function loadPlayerFormTeamsAction(requiredPermission) {
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

  return { ok: true, teams, scopeContext };
}

export async function savePlayerWithScopeAction(
  playerPayload,
  playerId = null,
) {
  const requiredPermission = playerId ? "players.edit" : "players.create";
  const permissionResult = await assertAdminActionPermission({
    requiredPermission,
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;
  const targetTeamIds = normalizeTargetTeamIds(playerPayload || {});

  const { data: allTeams, error: allTeamsError } = await supabaseServer
    .from("teams")
    .select("*")
    .order("sort_order", { ascending: true });

  if (allTeamsError) {
    return buildError(
      `Mannschaften konnten nicht geladen werden: ${allTeamsError.message}`,
    );
  }

  const targetTeamMap = new Map(
    (allTeams || [])
      .filter((team) => team?.is_active !== false)
      .map((team) => [team.id, team]),
  );

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
  });

  if (error) {
    return buildError(error.message || "Fehler beim Speichern.");
  }

  revalidatePath("/admin/players");

  return { error: null };
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
    return buildError("Du darfst diesen Spieler nicht loeschen.");
  }

  const result = await supabaseServer.rpc("remove_entity", {
    entity_type: "player",
    entity_uuid: playerId,
  });

  if (!result.error) {
    revalidatePath("/admin/players");
  }

  return result;
}
