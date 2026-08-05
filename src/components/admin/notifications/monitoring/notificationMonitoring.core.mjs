const timeRanges = { today: 1, seven: 7, thirty: 30, ninety: 90 };

export function createPersistedAuditEntry(row = {}) {
  return {
    id: row.id, timestamp: row.created_at, source: "audit", type: row.notification_type || "unknown", status: row.status || "warning",
    actorId: row.actor_user_id || null, recipientId: row.recipient_user_id || null, recipientCount: Number(row.recipient_count || 0),
    afterDedupeCount: Number(row.metadata?.recipientAnalysis?.afterDedupe || 0), actorRemovedCount: Number(row.metadata?.recipientAnalysis?.actorRemoved || 0), successCount: Number(row.successful_count || 0), failedCount: Number(row.failed_count || 0), duplicateCount: Number(row.duplicate_count || 0),
    skippedCount: Number(row.skipped_count || 0), durationMs: row.duration_ms, route: row.target_url || "/admin/notifications", errorClass: row.error_class || null,
    resolver: row.resolver_source || "central-notification-service",
  };
}

export function filterMonitoringEntries(entries = [], { search = "", status = "all", range = "seven", now = new Date() } = {}) {
  const query = String(search).trim().toLowerCase();
  const since = timeRanges[range] ? now.getTime() - timeRanges[range] * 86400000 : null;
  return entries.filter((entry) => {
    if (status !== "all" && entry.status !== status) return false;
    if (since && new Date(entry.timestamp).getTime() < since) return false;
    if (!query) return true;
    return [entry.type, entry.actorId, entry.recipientId, entry.route, entry.errorClass].some((value) => String(value || "").toLowerCase().includes(query));
  }).sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));
}

export function buildNotificationHealth(entries = []) {
  const sum = (key) => entries.reduce((total, item) => total + Number(item[key] || 0), 0);
  const successful = sum("successCount");
  const failures = sum("failedCount");
  const duplicates = sum("duplicateCount");
  const actorRemoved = sum("actorRemovedCount");
  const skipped = sum("skippedCount");
  const successDates = entries.filter((item) => item.status === "success").map((item) => item.timestamp);
  const failureDates = entries.filter((item) => item.status === "failed").map((item) => item.timestamp);
  return { successful, failures, duplicates, actorRemoved, skipped, recipientsWithoutProfile: null, recipientsWithoutPermission: null, unknownRecipients: null, lastSuccess: successDates.sort().at(-1) || null, lastFailure: failureDates.sort().at(-1) || null, status: failures ? "warning" : "success" };
}

export function buildTopErrors(entries = []) {
  const counts = new Map();
  for (const entry of entries) if (entry.errorClass || entry.duplicateCount) {
    const key = entry.errorClass || "idempotency_duplicate";
    counts.set(key, (counts.get(key) || 0) + Math.max(1, entry.failedCount || entry.duplicateCount));
  }
  return [...counts].map(([errorClass, count]) => ({ errorClass, count })).sort((a, b) => b.count - a.count);
}

export function buildActiveTypes(entries = []) {
  const map = new Map();
  for (const entry of entries) {
    const current = map.get(entry.type) || { type: entry.type, count: 0, failures: 0, lastDelivery: null };
    current.count += Number(entry.successCount || 0);
    current.failures += Number(entry.failedCount || 0);
    if (!current.lastDelivery || new Date(entry.timestamp) > new Date(current.lastDelivery)) current.lastDelivery = entry.timestamp;
    map.set(entry.type, current);
  }
  return [...map.values()].map((item) => ({ ...item, errorRate: item.count + item.failures ? item.failures / (item.count + item.failures) : 0 })).sort((a, b) => b.count - a.count).slice(0, 20);
}
