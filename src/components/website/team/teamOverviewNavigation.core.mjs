export const FOOTBALL_TEAM_OVERVIEW_ROUTES = Object.freeze({
  junioren: "/fussball/mannschaften/junioren",
  senioren: "/fussball/mannschaften/senioren",
  damen: "/fussball/mannschaften/damen",
});

export const TABLE_TENNIS_TEAM_OVERVIEW_ROUTE = "/tischtennis/mannschaften";

function normalizeAgeGroup(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function resolveFootballTeamOverviewRoute(team = {}) {
  const ageGroup = normalizeAgeGroup(team.age_group);

  if (/(damen|frauen|women|ladies)/.test(ageGroup)) {
    return FOOTBALL_TEAM_OVERVIEW_ROUTES.damen;
  }

  if (/(senior|herren|men|alte\s*herren)/.test(ageGroup)) {
    return FOOTBALL_TEAM_OVERVIEW_ROUTES.senioren;
  }

  if (/(jugend|bambini|mini|u\s?-?\d{1,2}|[a-f]\s?-?jugend)/.test(ageGroup)) {
    return FOOTBALL_TEAM_OVERVIEW_ROUTES.junioren;
  }

  return "/fussball/mannschaften";
}
