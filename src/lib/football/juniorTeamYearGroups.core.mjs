export function normalizeTeamBirthYears(birthYears = []) {
  return Array.from(
    new Set(
      birthYears
        .filter((value) => value !== null && value !== undefined && value !== "")
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 1900 && value <= 2100),
    ),
  ).sort((left, right) => left - right);
}

export function attachJuniorTeamBirthYears(teams = [], mappings = []) {
  const yearsByTeamSeasonId = new Map();

  for (const mapping of mappings) {
    if (!mapping?.team_season_id) continue;
    const years = yearsByTeamSeasonId.get(mapping.team_season_id) || [];
    years.push(mapping.birth_year);
    yearsByTeamSeasonId.set(mapping.team_season_id, years);
  }

  return teams.map((team) => ({
    ...team,
    birthYears: normalizeTeamBirthYears(
      yearsByTeamSeasonId.get(team.team_season_id) || [],
    ),
  }));
}

export function formatTeamBirthYears(birthYears = []) {
  const years = normalizeTeamBirthYears(birthYears);
  if (!years.length) return "";
  return `${years.length === 1 ? "Jahrgang" : "Jahrgänge"} ${years.join(" · ")}`;
}
