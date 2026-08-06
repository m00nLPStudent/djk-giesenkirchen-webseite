import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";

const count = (value) => Math.max(0, Number(value || 0));

function createAuditPayload(event = {}) {
  const analysis = event.recipientAnalysis || {};
  const preferences = event.preferenceAnalysis || {};
  return {
    p_notification_type: event.type || "unknown",
    p_status: event.status || "warning",
    p_actor_user_id: event.actorId || null,
    p_recipient_user_id: event.recipientId || null,
    p_recipient_count: count(event.recipientCount),
    p_successful_count: count(event.successCount),
    p_failed_count: count(event.failedCount),
    p_duplicate_count: count(event.duplicateCount),
    p_skipped_count: count(event.skippedCount),
    p_duration_ms: count(event.durationMs),
    p_target_url: event.route || null,
    p_resolver_source: event.resolver || "central-notification-service",
    p_error_class: event.errorClass || null,
    p_idempotency_key: event.idempotencyKey || null,
    p_metadata: {
      recipientAnalysis: {
        resolverInput: count(analysis.resolverInput ?? event.recipientCount),
        foundTrainers: count(analysis.foundTrainers),
        activeTrainers: count(analysis.activeTrainers),
        adminProfiles: count(analysis.adminProfiles),
        validAuthUsers: count(analysis.validAuthUsers),
        afterActorFilter: count(analysis.afterActorFilter ?? (count(event.recipientCount) - count(event.actorRemovedCount))),
        afterDedupe: count(analysis.afterDedupe ?? event.afterDedupeCount),
        storedNotifications: count(event.successCount),
        actorRemoved: count(analysis.actorRemoved ?? event.actorRemovedCount),
      },
      preferenceAnalysis: {
        inputCount: count(preferences.inputCount),
        skippedCount: count(preferences.skippedCount),
        outputCount: count(preferences.outputCount),
        mandatoryType: preferences.mandatoryType === true,
      },
      ...(event.dispatcherAnalysis ? { dispatcherAnalysis: event.dispatcherAnalysis } : {}),
    },
  };
}

export async function recordNotificationMonitoringEvent(event = {}, { db } = {}) {
  try {
    const auditDb = db || createSupabaseAdminClient();
    if (!auditDb) return { data: null, error: new Error("Notification-Audit-Service-Client ist nicht konfiguriert.") };
    const result = await auditDb.rpc("append_notification_audit", createAuditPayload(event));
    return { data: result.data ? { id: result.data } : null, error: result.error || null };
  } catch (error) {
    return { data: null, error };
  }
}

export { createAuditPayload };
