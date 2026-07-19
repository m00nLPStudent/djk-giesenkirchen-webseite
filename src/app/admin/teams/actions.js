"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  canAccessTeamOnServer,
  canReachTeamCreateOnServer,
  loadServerTeamScopeContext,
} from "@/components/admin/teams/serverTeamScope";
import { canCreateTeamInScope } from "@/components/admin/teams/teamScope";
import { saveTeamWithSeason } from "@/components/admin/teams/services/teams.service";
import { executeSafeTeamDeleteOrArchive } from "@/components/admin/teams/services/teamDelete.service";
import { revalidatePath } from "next/cache";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

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

  const result = await saveTeamWithSeason(teamPayload || {}, teamId, {
    client: supabaseServer,
  });

  if (result?.error) {
    return buildError(result.error.message || "Fehler beim Speichern.");
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

  const result = await executeSafeTeamDeleteOrArchive(
    supabaseServer,
    existingTeam,
  );

  if (!result?.error) {
    revalidatePath("/admin");
    revalidatePath("/admin/teams");
    revalidatePublicContent("teams");
  }

  return result;
}
