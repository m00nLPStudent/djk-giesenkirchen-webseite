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

function buildError(message) {
  return { error: { message } };
}

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

    const targetResolution = await resolveCoachTeamSeasonTargets(
      supabaseServer,
      coachPayload?.assignments || [],
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

    const saveResult = await saveCoach(coachPayload || {}, coachId, {
      client: supabaseServer,
      teamSeasonOptions: targetResolution.teamSeasonOptions,
    });

    if (saveResult.error) {
      return buildError(saveResult.error.message || "Fehler beim Speichern.");
    }

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
