export const TRAINING_TIME_FIELDS = ["team_season_id", "weekday", "start_time", "end_time", "training_type", "location_name", "location_address", "location_city", "is_active", "effective_from", "effective_until"];
export const TRAINING_EXCEPTION_FIELDS = ["team_training_time_id", "exception_date", "exception_type", "override_start_time", "override_end_time", "override_location_name", "override_location_address", "override_location_city", "is_active"];

const changes = (previous, next, fields) => fields.filter((field) => (previous?.[field] ?? null) !== (next?.[field] ?? null));

export function normalizeTrainingTimePayload(payload = {}) {
  return {
    team_season_id: payload.team_season_id || null,
    weekday: Number(payload.weekday || 1),
    start_time: payload.start_time || null,
    end_time: payload.end_time || null,
    training_type: payload.training_type || "training",
    location_name: payload.location_name || null,
    location_address: payload.location_address || null,
    location_city: payload.location_city || null,
    is_active: payload.is_active ?? true,
    effective_from: payload.effective_from || null,
    effective_until: payload.effective_until || null,
    note: payload.note || null,
  };
}

export function normalizeTrainingExceptionPayload(payload = {}) {
  return {
    team_training_time_id: payload.team_training_time_id || null,
    exception_date: payload.exception_date || null,
    exception_type: payload.exception_type || "cancelled",
    override_start_time: payload.override_start_time || null,
    override_end_time: payload.override_end_time || null,
    override_location_name: payload.override_location_name || null,
    override_location_address: payload.override_location_address || null,
    override_location_city: payload.override_location_city || null,
    note: payload.note || null,
    is_active: payload.is_active ?? true,
  };
}

export function getTrainingTimePlan(previous, next) {
  if (!previous && next) return { action: "created", type: "event_created", changedFields: ["created"] };
  if (previous && !next) return { action: "removed", type: "event_cancelled", changedFields: ["removed"] };
  const changedFields = changes(previous, next, TRAINING_TIME_FIELDS);
  return changedFields.length ? { action: "updated", type: "event_updated", changedFields } : null;
}

export function getTrainingExceptionPlan(previous, next) {
  if (!next?.exception_date && !previous?.exception_date) return null;
  if (previous && !next) return { action: "reverted", type: "event_updated", changedFields: ["removed"] };
  const changedFields = previous ? changes(previous, next, TRAINING_EXCEPTION_FIELDS) : ["created"];
  if (!changedFields.length) return null;
  if (next?.exception_type === "cancelled" && next?.is_active !== false) return { action: "cancelled", type: "event_cancelled", changedFields };
  if (next?.exception_type === "moved" && next?.is_active !== false) return { action: "moved", type: "event_updated", changedFields };
  return { action: "reverted", type: "event_updated", changedFields };
}
