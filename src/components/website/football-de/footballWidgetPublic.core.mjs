export function selectConfiguredFootballWidgetTeams({ teams = [], teamSeasons = [], departmentId, seasonId }) {
  const seasonsByTeam = new Map(
    teamSeasons
      .filter((item) => item?.is_active && item.season_id === seasonId)
      .map((item) => [item.team_id, item]),
  );

  return teams
    .filter((team) => team?.is_active && team.department_id === departmentId)
    .map((team) => ({ team, teamSeason: seasonsByTeam.get(team.id) }))
    .filter(({ teamSeason }) => teamSeason && (teamSeason.fussball_de_matches_widget_id || teamSeason.fussball_de_table_widget_id))
    .sort((left, right) => (left.team.sort_order ?? 999) - (right.team.sort_order ?? 999) || left.team.name_de.localeCompare(right.team.name_de, "de"))
    .map(({ team, teamSeason }) => ({
      slug: team.slug,
      name: teamSeason.name_de || team.name_de,
      fussball_de_matches_widget_id: teamSeason.fussball_de_matches_widget_id || null,
      fussball_de_table_widget_id: teamSeason.fussball_de_table_widget_id || null,
    }));
}
