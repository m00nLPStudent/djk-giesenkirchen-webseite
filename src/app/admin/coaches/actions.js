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
import { saveCoach } from "@/components/admin/coaches/services/coaches.service";
import { revalidatePath } from "next/cache";

function buildError(message) {
  return { error: { message } };
}

async function loadCoachById(client, coachId) {
  const { data } = await client
    .from("coaches")
    .select("*")
    .eq("id", coachId)
    .maybeSingle();

  return data || null;
}

export async function saveCoachWithScopeAction(coachPayload, coachId = null) {
  const requiredPermission = coachId ? "coaches.edit" : "coaches.create";
  const permissionResult = await assertAdminActionPermission({
    requiredPermission,
  });

  if (!permissionResult.ok) {
    return buildError(permissionResult.message || "Berechtigung fehlt.");
  }

  const scopeContext = await loadServerPersonScopeContext(permissionResult);
  const supabaseServer = permissionResult.supabaseServer;
  const allowedTeams = await loadScopedActiveTeamsForPeople(
    scopeContext,
    supabaseServer,
  );
  const allowedTeamIds = new Set(allowedTeams.map((team) => team.id));
  const targetTeamId = coachPayload?.team_id || null;

  if (targetTeamId && !allowedTeamIds.has(targetTeamId)) {
    return buildError("Du darfst Trainer nicht fremden Mannschaften zuordnen.");
  }

  if (coachId) {
    const coach = await loadCoachById(supabaseServer, coachId);
    if (!coach) {
      return buildError("Trainer nicht gefunden.");
    }

    const { teamIdsByCoachId, teamById } = await getCoachTeamIdsMap(
      supabaseServer,
      [coachId],
    );
    const coachTeamIds = teamIdsByCoachId.get(coachId) || [];

    if (!canEditCoachOnServer(scopeContext, coach, coachTeamIds, teamById)) {
      return buildError("Du darfst dieses Trainerprofil nicht bearbeiten.");
    }
  } else if (!canCreateCoachOnServer(scopeContext)) {
    return buildError("Du darfst keine Trainerprofile erstellen.");
  }

  const { error } = await saveCoach(coachPayload || {}, coachId, {
    client: supabaseServer,
  });

  if (error) {
    return buildError(error.message || "Fehler beim Speichern.");
  }

  revalidatePath("/admin/coaches");

  return { error: null };
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

  const result = await supabaseServer.rpc("remove_entity", {
    entity_type: "coach",
    entity_uuid: coachId,
  });

  if (!result.error) {
    revalidatePath("/admin/coaches");
  }

  return result;
}
