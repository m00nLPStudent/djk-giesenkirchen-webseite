import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createNotificationsOnce } from "@/components/admin/notifications/notifications.service";
import { createAdminNotificationRecipients, loadAdminNotificationRecipientSource } from "@/components/admin/notifications/workflowNotificationRecipients.repository";
import { buildSupportTicketNotification, resolveSupportManagers, resolveTicketCreator } from "./supportTicketNotifications.core.mjs";

export function logSupportTicketNotificationFailure(context, error) {
  if (error) console.error("[support-ticket-notification]", { context, code: "support_ticket_notification_failed" });
}

export async function notifySupportTicketWorkflow({ type, ticket, actorUserId, actorIsSupport = false, operationId, status }, { db: providedDb = null } = {}) {
  const db = providedDb || createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const source = await loadAdminNotificationRecipientSource(db);
  if (source.error || !source.data) return { delivered: 0, skipped: 0, error: source.error || new Error("Notification-Empfänger konnten nicht geladen werden.") };
  const candidates = createAdminNotificationRecipients(source.data);
  const recipients = type === "ticket_created" || (type === "ticket_reply_created" && !actorIsSupport)
    ? resolveSupportManagers(candidates, actorUserId)
    : [resolveTicketCreator(candidates, ticket?.created_by_profile_id || ticket?.createdByProfileId, actorUserId)].filter(Boolean);
  const event = buildSupportTicketNotification(type, ticket, { operationId, status });
  const inputs = recipients.map((recipient) => ({ ...event, recipientUserId: recipient.userId, actorUserId }));
  if (!inputs.length) return { delivered: 0, skipped: 0, error: null };
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}
