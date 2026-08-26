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
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { normalizeBirthYears } from "@/components/admin/teams/services/teamSeasonYearGroups.core.mjs";
import { replaceTeamSeasonYearGroups } from "@/components/admin/teams/services/teamSeasonYearGroups.repository";

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
    roles: permissionResult.roles || [],
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

  let existingTeam = null;
  if (teamId) {
    existingTeam = await loadTeamById(supabaseServer, teamId);

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

  const allowedVisibilities = canManageMedia(authContext.roles) ? ["public", "admin"] : ["public"];
  const mediaResult = await resolveEntityImageMedia(teamPayload?.team_image_media_asset_id || null, { allowArchived: Boolean(existingTeam?.team_image_media_asset_id === teamPayload?.team_image_media_asset_id), allowedVisibilities });
  if (mediaResult.error) return buildError(mediaResult.error.message);
  const contactMediaResult = await resolveEntityImageMedia(teamPayload?.contact_image_media_asset_id || null, { allowArchived: Boolean(existingTeam?.contact_image_media_asset_id === teamPayload?.contact_image_media_asset_id), allowedVisibilities });
  if (contactMediaResult.error) return buildError(contactMediaResult.error.message);
  const existingTeamSeason = teamPayload?.season_id && existingTeam?.id
    ? (await supabaseServer.from("team_seasons").select("id, team_image_media_asset_id, contact_image_media_asset_id").eq("team_id", existingTeam.id).eq("season_id", teamPayload.season_id).maybeSingle()).data
    : null;
  const seasonMediaResult = await resolveEntityImageMedia(teamPayload?.season_team_image_media_asset_id || null, { allowArchived: Boolean(existingTeamSeason?.team_image_media_asset_id === teamPayload?.season_team_image_media_asset_id), allowedVisibilities });
  if (seasonMediaResult.error) return buildError(seasonMediaResult.error.message);
  const seasonContactMediaResult = await resolveEntityImageMedia(teamPayload?.season_contact_image_media_asset_id || null, { allowArchived: Boolean(existingTeamSeason?.contact_image_media_asset_id === teamPayload?.season_contact_image_media_asset_id), allowedVisibilities });
  if (seasonContactMediaResult.error) return buildError(seasonContactMediaResult.error.message);

  const previousRoster = teamId && teamPayload?.season_id
    ? await loadTeamRosterNotificationSnapshot(supabaseServer, teamId, teamPayload.season_id)
    : { data: null, error: null };

  const result = await saveTeamWithSeason(teamPayload || {}, teamId, {
    client: supabaseServer,
  });

  if (result?.error) {
    return buildError(result.error.message || "Fehler beim Speichern.");
  }

  const usageResult = await synchronizeMediaAssignment("team", result.teamId, mediaResult.data?.id || null);
  if (usageResult.error) {
    console.error("[team-media-sync]", { code: usageResult.error.code || "TEAM_MEDIA_SYNC_FAILED", message: usageResult.error.message || "Unbekannter Fehler" });
    return buildError("Die Mannschaftsbild-Verwendung konnte nicht gespeichert werden.");
  }
  const contactUsageResult = await synchronizeMediaAssignment("team", result.teamId, contactMediaResult.data?.id || null, "contact_image");
  if (contactUsageResult.error) {
    console.error("[team-contact-media-sync]", { code: contactUsageResult.error.code || "TEAM_CONTACT_MEDIA_SYNC_FAILED", message: contactUsageResult.error.message || "Unbekannter Fehler" });
    return buildError("Die Kontaktbild-Verwendung konnte nicht gespeichert werden.");
  }
  if (result.teamSeasonId) {
    const seasonUsageResult = await synchronizeMediaAssignment("team_season", result.teamSeasonId, seasonMediaResult.data?.id || null);
    if (seasonUsageResult.error) {
      console.error("[team-season-media-sync]", { code: seasonUsageResult.error.code || "TEAM_SEASON_MEDIA_SYNC_FAILED", message: seasonUsageResult.error.message || "Unbekannter Fehler" });
      return buildError("Die saisonale Mannschaftsbild-Verwendung konnte nicht gespeichert werden.");
    }
    const seasonContactUsageResult = await synchronizeMediaAssignment("team_season", result.teamSeasonId, seasonContactMediaResult.data?.id || null, "contact_image");
    if (seasonContactUsageResult.error) {
      console.error("[team-season-contact-media-sync]", { code: seasonContactUsageResult.error.code || "TEAM_SEASON_CONTACT_MEDIA_SYNC_FAILED", message: seasonContactUsageResult.error.message || "Unbekannter Fehler" });
      return buildError("Die saisonale Kontaktbild-Verwendung konnte nicht gespeichert werden.");
    }
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

  revalidatePath("/admin/teams");
  revalidatePath(`/admin/teams/${result.teamId}`);
  revalidatePublicContent("teams");
  return { error: null };
}

export async function saveTeamSeasonYearGroupsAction(teamId, teamSeasonId, values) {
  const auth = await loadAuthorizedTeamMutationContext("teams.edit");
  if (!auth.ok) return auth.result;
  const team = await loadTeamById(auth.supabaseServer, teamId);
  if (!team || !canAccessTeamOnServer(auth.scopeContext, team)) return buildError("Du hast keinen Zugriff auf diese Mannschaft.");
  const normalized = normalizeBirthYears(values);
  if (normalized.error) return buildError(normalized.error.message);
  const { data: teamSeason, error } = await auth.supabaseServer.from("team_seasons").select("id, team_id").eq("id", teamSeasonId).eq("team_id", teamId).maybeSingle();
  if (error || !teamSeason) return buildError("Die Mannschaftssaison ist ungueltig.");
  const adminDb = createSupabaseAdminClient();
  if (!adminDb) return buildError("Serverseitiger Datenbankzugriff ist nicht konfiguriert.");
  const result = await replaceTeamSeasonYearGroups(adminDb, teamSeason.id, normalized.data);
  if (result.error) return buildError("Die Jahrgaenge konnten nicht gespeichert werden.");
  revalidatePath(`/admin/teams/edit/${teamId}`);
  revalidatePath("/admin/settings/seasons-teams");
  return { data: normalized.data, error: null };
}

async function authorizeTeamMedia(teamId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: teamId ? "teams.edit" : "teams.create" });
  if (!permissionResult.ok) return { ok: false, message: permissionResult.message || "Berechtigung fehlt." };
  const scopeContext = await loadServerTeamScopeContext(permissionResult);
  if (teamId) {
    const team = await loadTeamById(permissionResult.supabaseServer, teamId);
    if (!team || !canAccessTeamOnServer(scopeContext, team)) return { ok: false, message: "Du hast keinen Zugriff auf diese Mannschaft." };
  } else if (!canReachTeamCreateOnServer(scopeContext)) return { ok: false, message: "Du darfst keine Mannschaft erstellen." };
  return { ok: true, permissionResult };
}

export async function loadTeamMediaPickerAction(filters = {}, teamId = null) {
  const auth = await authorizeTeamMedia(teamId);
  if (!auth.ok) return { ok: false, error: auth.message, items: [], total: 0 };
  const allowed = canManageMedia(auth.permissionResult.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "team");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadTeamMediaAction(formData, teamId = null) {
  try {
    const auth = await authorizeTeamMedia(teamId);
    if (!auth.ok) return { ok: false, error: auth.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Für Mannschaftsbilder sind nur JPEG, PNG und WebP erlaubt." };
    const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "team" }, auth.permissionResult.profile.id);
    if (result.error) {
      console.error("[team-media-upload]", { stage: result.stage, code: result.error.code || "TEAM_MEDIA_UPLOAD_FAILED", message: result.error.message, rollbackAttempted: Boolean(result.rollbackAttempted), rollbackErrorCode: result.rollbackError?.code || null });
      return { ok: false, error: result.stage === "validation" ? result.error.message : "Das Mannschaftsbild konnte nicht hochgeladen werden." };
    }
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "team" });
    return resolved.error ? { ok: false, error: "Das hochgeladene Mannschaftsbild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
  } catch (error) {
    console.error("[team-media-upload]", { stage: "server_action", code: error?.code || "UNEXPECTED_TEAM_MEDIA_ACTION_ERROR", message: error?.message || "Unbekannter Fehler" });
    return { ok: false, error: "Das Mannschaftsbild konnte nicht hochgeladen werden." };
  }
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
