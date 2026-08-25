const TARGETS = new Set(["coach", "player", "board_member", "club_contact", "team", "team_season", "news", "news_document", "event"]);
const CONTACT_IMAGE_TARGETS = new Set(["team", "team_season"]);

export function buildMediaAssignmentPayload(entityType, entityId, mediaAssetId, fieldName = "image") {
  const validField = (fieldName === "image" && entityType !== "news_document") ||
    (fieldName === "contact_image" && CONTACT_IMAGE_TARGETS.has(entityType)) ||
    (fieldName === "file" && entityType === "news_document");
  if (!TARGETS.has(entityType) || !entityId || !validField) {
    return { ok: false, error: new Error("Ungültiges Medienziel.") };
  }
  return { ok: true, payload: { p_entity_type: entityType, p_entity_id: entityId, p_media_asset_id: mediaAssetId || null, p_field_name: fieldName } };
}
