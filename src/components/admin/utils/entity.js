export function getFullName(entity = {}, fallback = "Unbekannt") {
  if (entity.displayName) return entity.displayName;
  const directName = entity.name?.trim?.();
  if (directName) return directName;

  const composedName = `${entity.first_name || entity.firstName || ""} ${entity.last_name || entity.lastName || ""}`.trim();
  return composedName || fallback;
}

export function getEntityTeam(
  entity = {},
  { includeLegacyTeamId = true } = {},
) {
  const team = Array.isArray(entity.teams) ? entity.teams[0] : entity.teams;
  const primaryAssignment = entity.primaryAssignment || entity.assignments?.[0] || null;

  return {
    id:
      primaryAssignment?.teamId ||
      team?.id ||
      (includeLegacyTeamId ? entity.team_id : null) ||
      null,
    name:
      primaryAssignment?.teamNameDe ||
      primaryAssignment?.teamNameEn ||
      team?.name_de ||
      entity.primaryTeamName ||
      "Keine Mannschaft",
    slug: primaryAssignment?.teamSlug || team?.slug || null,
  };
}

export function getEntityImage(
  entity = {},
  fallbackImage,
  fields = ["imageUrl", "image_url", "photo_url"],
) {
  for (const field of fields) {
    if (entity[field]) return entity[field];
  }

  return fallbackImage;
}
