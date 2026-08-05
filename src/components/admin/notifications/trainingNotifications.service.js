import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createNotificationsOnce } from "./notifications.service";
import { resolveTeamNotificationRecipients } from "./teamAssignmentNotifications.service";
import { buildTrainingExceptionNotification, buildTrainingTimeNotification, resolveTrainingTarget } from "./trainingNotification.core.mjs";

export function logTrainingNotificationFailure(context, error) {
  if (error) console.error("[training-notification]", { context, message: error.message || "Unbekannter Notification-Fehler" });
}

export async function notifyTrainingMutation({ model, plan, previous = null, next = null, teamContext, actorUserId }) {
  if (!plan || !teamContext?.teamSeasonId) return { delivered: 0, skipped: 0, error: null };
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const resolved = await resolveTeamNotificationRecipients(db, [teamContext.teamSeasonId], actorUserId);
  if (resolved.error) return { delivered: 0, skipped: 0, error: resolved.error };
  const builder = model === "exception" ? buildTrainingExceptionNotification : buildTrainingTimeNotification;
  const event = builder(plan, next || previous, { ...teamContext, previous });
  const inputs = resolved.recipients.filter((recipient) => recipient.userId !== actorUserId).map((recipient) => ({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: resolveTrainingTarget(recipient, event), monitoringRecipientAnalysis: resolved.analysis }));
  if (!inputs.length) return { delivered: 0, skipped: 0, error: null };
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}
