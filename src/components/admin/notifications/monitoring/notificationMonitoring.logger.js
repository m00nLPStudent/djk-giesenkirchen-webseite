import "server-only";

import { createServerActionSupabaseClient } from "@/lib/supabase.server";

const count = (value) => Math.max(0, Number(value || 0));

function createAuditPayload(event = {}) {
  const analysis = event.recipientAnalysis || {};
  const preferences = event.preferenceAnalysis || {};
  return {
    notification_type: event.type || "unknown",
    status: event.status || "warning",
    actor_user_id: event.actorId || null,
    recipient_user_id: event.recipientId || null,
    recipient_count: count(event.recipientCount),
    successful_count: count(event.successCount),
    failed_count: count(event.failedCount),
    duplicate_count: count(event.duplicateCount),
    skipped_count: count(event.skippedCount),
    duration_ms: count(event.durationMs),
    target_url: event.route || null,
    resolver_source: event.resolver || "central-notification-service",
    error_class: event.errorClass || null,
    idempotency_key: event.idempotencyKey || null,
    retry_count: 0,
    last_retry_at: null,
    retry_allowed: false,
    metadata: {
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
    },
  };
}

export async function recordNotificationMonitoringEvent(event = {}, { db } = {}) {
  try {
    const auditDb = db || await createServerActionSupabaseClient();
    const result = await auditDb.from("notification_audit").insert(createAuditPayload(event)).select("id, created_at").single();
    return { data: result.data || null, error: result.error || null };
  } catch (error) {
    return { data: null, error };
  }
}

export { createAuditPayload };
