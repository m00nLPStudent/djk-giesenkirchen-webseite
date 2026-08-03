"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canAccessTeamOnServer,
  canReachTeamCreateOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { canCreateTeamInScope } from "@/components/admin/teams/teamScope";
import { saveTeamWithSeason } from "@/components/admin/teams/services/teams.service";
import { archiveTeam } from "@/components/admin/archiving/archive.service";
import { revalidatePath } from "next/cache";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";
import { loadTeamRosterNotificationSnapshot } from "@/components/admin/notifications/teamRosterNotification.repository";
import { logNotificationFailure, notifyTeamArchived, notifyTeamRosterChange } from "@/components/admin/notifications/teamAssignmentNotifications.service";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";

function buildError(message) {
  return { error: { message } };
}

async function loadTeamById(client, teamId) {
  if (!teamId) return null;

  const { data } = await client
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  return data || null;
}

async function loadAuthorizedTeamMutationContext(requiredPermission) {
  const permissionResult = await assertAdminActionPermission({
    requiredPermission,
  });

  if (!permissionResult.ok) {
    return {
      ok: false,
      result: buildError(permissionResult.message || "Berechtigung fehlt."),
    };
  }

  const scopeContext = await loadServerTeamScopeContext(permissionResult);

  return {
    ok: true,
    supabaseServer: permissionResult.supabaseServer,
    scopeContext,
    userId: permissionResult.userId,
  };
}

export async function saveTeamWithScopeAction(teamPayload, teamId = null) {
  const requiredPermission = teamId ? "teams.edit" : "teams.create";
  const authContext =
    await loadAuthorizedTeamMutationContext(requiredPermission);

  if (!authContext.ok) {
    return authContext.result;
  }

  const { supabaseServer, scopeContext } = authContext;

  if (teamId) {
    const existingTeam = await loadTeamById(supabaseServer, teamId);

    if (!existingTeam || !canAccessTeamOnServer(scopeContext, existingTeam)) {
      return buildError("Du hast keinen Zugriff auf diese Mannschaft.");
    }
  } else {
    if (!canReachTeamCreateOnServer(scopeContext)) {
      return buildError("Du darfst keine Mannschaft erstellen.");
    }

    if (!canCreateTeamInScope(scopeContext, teamPayload || {})) {
      return buildError(
        "Mit deinem Scope kannst du diese Mannschaft nicht erstellen.",
      );
    }
  }

  const previousRoster = teamId && teamPayload?.season_id
    ? await loadTeamRosterNotificationSnapshot(supabaseServer, teamId, teamPayload.season_id)
    : { data: null, error: null };

  const result = await saveTeamWithSeason(teamPayload || {}, teamId, {
    client: supabaseServer,
  });

  if (result?.error) {
    return buildError(result.error.message || "Fehler beim Speichern.");
  }

  if (previousRoster.error) {
    logNotificationFailure("load-team-roster-before-save", previousRoster.error);
  } else if (result.teamId && result.teamSeasonId) {
    const nextRoster = await loadTeamRosterNotificationSnapshot(supabaseServer, result.teamId, teamPayload.season_id);
    if (nextRoster.error) logNotificationFailure("load-team-roster-postcheck", nextRoster.error);
    else {
      const notificationResult = await notifyTeamRosterChange({ previous: previousRoster.data, next: nextRoster.data, actorUserId: authContext.userId });
      logNotificationFailure("save-team-roster", notificationResult.error);
    }
  }

  return { error: null };
}

export async function removeTeamWithScopeAction(teamId) {
  const authContext = await loadAuthorizedTeamMutationContext("teams.delete");

  if (!authContext.ok) {
    return authContext.result;
  }

  const { supabaseServer, scopeContext } = authContext;
  const existingTeam = await loadTeamById(supabaseServer, teamId);

  if (!existingTeam) {
    return buildError("Mannschaft nicht gefunden.");
  }

  if (!canAccessTeamOnServer(scopeContext, existingTeam)) {
    return buildError("Du hast keinen Zugriff auf diese Mannschaft.");
  }

  const season = await loadCurrentSeasonResolution(supabaseServer);
  const rosterSnapshot = season.activeSeasonId
    ? await loadTeamRosterNotificationSnapshot(supabaseServer, teamId, season.activeSeasonId)
    : { data: null, error: null };
  const result = await archiveTeam(supabaseServer, teamId);

  if (result?.ok) {
    if (rosterSnapshot.error) logNotificationFailure("load-team-roster-before-archive", rosterSnapshot.error);
    else if (rosterSnapshot.data) {
      const notificationResult = await notifyTeamArchived({ snapshot: rosterSnapshot.data, actorUserId: authContext.userId });
      logNotificationFailure("archive-team-roster", notificationResult.error);
    }
    revalidatePath("/admin");
    revalidatePath("/admin/teams");
    revalidatePath(`/admin/teams/${teamId}`);
    revalidatePath("/admin/players");
    revalidatePublicContent("teams");
  }

  return result?.ok ? { error: null, ...result } : { error: { message: result.message }, ...result };
}
