export function buildSeasonTeamYearsView({ seasons = [], teamSeasons = [], mappings = [], requestedSeasonId = "" }) {
  const selectedSeason = seasons.find((season) => season.id === requestedSeasonId)
    || seasons.find((season) => season.is_current)
    || seasons[0]
    || null;
  const yearsByTeamSeason = mappings.reduce((map, row) => {
    const current = map.get(row.team_season_id) || [];
    current.push(Number(row.birth_year));
    map.set(row.team_season_id, current);
    return map;
  }, new Map());
  const rows = selectedSeason ? teamSeasons.filter((row) => row.season_id === selectedSeason.id).map((row) => ({
    ...row,
    birthYears: Array.from(new Set(yearsByTeamSeason.get(row.id) || [])).sort((a, b) => a - b),
  })) : [];
  return { selectedSeasonId: selectedSeason?.id || "", rows };
}
