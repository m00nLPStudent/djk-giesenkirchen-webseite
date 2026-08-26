function normalizedTimestamp(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

export function requiresPublishPermission(previous, next, { tracksPublishedAt = false } = {}) {
  const wasPublished = Boolean(previous?.is_published);
  const willBePublished = Boolean(next?.is_published);

  if (!previous) return willBePublished;
  if (wasPublished !== willBePublished) return true;
  if (!tracksPublishedAt || !willBePublished) return false;

  return normalizedTimestamp(previous.published_at) !== normalizedTimestamp(next?.published_at);
}
