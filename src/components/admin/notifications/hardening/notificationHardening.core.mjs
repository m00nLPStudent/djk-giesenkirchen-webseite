export function normalizePageRequest(page = 1, pageSize = 100, maximum = 250) {
  return { page: Math.max(1, Math.trunc(Number(page) || 1)), pageSize: Math.min(maximum, Math.max(1, Math.trunc(Number(pageSize) || 100))) };
}
export function checkAuditConsistency(entry = {}) {
  const preference = entry.preferenceAnalysis || {};
  const preferenceValid = Number(preference.inputCount || 0) === Number(preference.skippedCount || 0) + Number(preference.outputCount || 0);
  const deliveryValid = Number(preference.outputCount || 0) === Number(entry.successfulCount || 0) + Number(entry.failedCount || 0);
  return { valid: preferenceValid && deliveryValid, preferenceValid, deliveryValid };
}
export function createSyntheticAuditRows(count) {
  return Array.from({ length: count }, (_, index) => ({ id:`audit-${index}`, timestamp:new Date(1770000000000-index*1000).toISOString(), type:["player_assigned","event_updated","membership_created"][index%3], status:index%17===0?"failed":"success", successCount:index%17===0?0:1, failedCount:index%17===0?1:0, duplicateCount:index%29===0?1:0, skippedCount:index%31===0?1:0, errorClass:index%17===0?"synthetic_failure":null }));
}
export function deduplicateSyntheticRecipients(recipients = [], actorUserId = null) { return [...new Set(recipients.filter((id)=>id && id!==actorUserId))]; }
