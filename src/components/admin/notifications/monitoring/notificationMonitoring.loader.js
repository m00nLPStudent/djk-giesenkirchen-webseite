import "server-only";

import { createServerActionSupabaseClient } from "@/lib/supabase.server";

export async function loadNotificationMonitoringSnapshot({ range = "seven", status = "all", search = "", limit = 1000 } = {}) {
  const db = await createServerActionSupabaseClient();
  const result = await db.rpc("load_notification_audit_monitoring", {
    p_range: range,
    p_status: status,
    p_search: search,
    p_limit: limit,
  });
  if (result.error) return { entries: [], health: {}, recipientAnalysis: {}, topErrors: [], activeTypes: [], error: result.error };
  const snapshot = result.data || {};
  return { entries: snapshot.entries || [], health: snapshot.health || {}, recipientAnalysis: snapshot.recipientAnalysis || {}, topErrors: snapshot.topErrors || [], activeTypes: snapshot.activeTypes || [], error: null };
}
