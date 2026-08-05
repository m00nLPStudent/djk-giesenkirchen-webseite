import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { resolveTeamNotificationRecipients } from "./teamAssignmentNotifications.service";
import { createNotificationsOnce } from "./notifications.service";
import { buildEventNotification, getEventNotificationPlan, resolveEditorialTarget } from "./editorialNotification.core.mjs";

export function logEditorialNotificationFailure(context, error) {
  if (error) console.error("[editorial-notification]", { context, message: error.message || "Unbekannter Notification-Fehler" });
}

export async function notifyEventWorkflow({ previous = null, next, actorUserId }) {
  const plan = getEventNotificationPlan(previous, next);
  if (!plan) return { delivered: 0, skipped: 0, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };

  const season = await loadCurrentSeasonResolution(db);
  if (!season.activeSeasonId) return { delivered: 0, skipped: 0, error: null };
  const teamSeasons = await db.from("team_seasons").select("id, team_id, name_de, teams(name_de)").eq("season_id", season.activeSeasonId).in("team_id", plan.teamIds).eq("is_active", true);
  if (teamSeasons.error) return { delivered: 0, skipped: 0, error: teamSeasons.error };
  const rows = teamSeasons.data || [];
  const resolved = await resolveTeamNotificationRecipients(db, rows.map((row) => row.id), actorUserId);
  if (resolved.error) return { delivered: 0, skipped: 0, error: resolved.error };

  const inputs = [];
  for (const row of rows) {
    const event = buildEventNotification(plan.type, next, {
      teamId: row.team_id,
      teamName: row.teams?.name_de || null,
      seasonLabel: row.name_de || null,
      changes: plan.changes,
      changeKey: next.updated_at || next.created_at,
    });
    for (const recipient of resolved.recipients.filter((item) => item.teamSeasonId === row.id && item.userId !== actorUserId)) {
      inputs.push({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: resolveEditorialTarget(recipient, event) });
    }
  }
  if (!inputs.length) return { delivered: 0, skipped: 0, error: null };
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}
