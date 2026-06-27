export function getFullName(entity = {}, fallback = "Unbekannt") {
  const directName = entity.name?.trim?.();
  if (directName) return directName;

  const composedName = `${entity.first_name || ""} ${entity.last_name || ""}`.trim();
  return composedName || fallback;
}

export function getEntityTeam(entity = {}) {
  const team = Array.isArray(entity.teams) ? entity.teams[0] : entity.teams;

  return {
    id: team?.id || entity.team_id || null,
    name: team?.name_de || entity.team_name || "Keine Mannschaft",
    slug: team?.slug || null,
  };
}

export function getEntityImage(entity = {}, fallbackImage, fields = ["image_url", "photo_url"]) {
  for (const field of fields) {
    if (entity[field]) return entity[field];
  }

  return fallbackImage;
}
