const TARGETS = new Set(["coach", "player", "board_member", "club_contact", "team", "team_season"]);

export function buildMediaAssignmentPayload(entityType, entityId, mediaAssetId, fieldName = "image") {
  if (!TARGETS.has(entityType) || !entityId || fieldName !== "image") {
    return { ok: false, error: new Error("Ungültiges Medienziel.") };
  }
  return { ok: true, payload: { p_entity_type: entityType, p_entity_id: entityId, p_media_asset_id: mediaAssetId || null, p_field_name: fieldName } };
}
