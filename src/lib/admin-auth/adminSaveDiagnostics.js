const isDev = process.env.NODE_ENV === "development";

function toErrorShape(error) {
  if (!error) return null;

  return {
    code: error.code || null,
    message: error.message || "Unbekannter Fehler",
    details: error.details || null,
  };
}

function toResultId(data) {
  if (!data) return null;

  if (Array.isArray(data)) {
    return data[0]?.id || null;
  }

  return data.id || null;
}

export function logAdminSaveEvent({
  module,
  mode,
  step,
  operation = null,
  success = null,
  error = null,
  data = null,
  navigationTriggered = null,
}) {
  if (!isDev) return;

  const payload = {
    module,
    mode,
    step,
    operation,
    success,
    resultId: toResultId(data),
    error: toErrorShape(error),
    navigationTriggered,
    ts: new Date().toISOString(),
  };

  console.warn("[admin-save]", payload);
}
