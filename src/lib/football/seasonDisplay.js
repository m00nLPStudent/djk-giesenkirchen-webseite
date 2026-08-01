function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolveSeasonDisplayName(team = {}, fallback = null) {
  return (
    normalizeText(team.public_season_name) ||
    normalizeText(team.seasonName) ||
    normalizeText(team.season_name) ||
    fallback
  );
}
