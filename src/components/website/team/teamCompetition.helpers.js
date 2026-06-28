export function normalizeTeamAgeGroup(team = {}) {
  return String(team.age_group || team.name_de || "").toLowerCase();
}

export function isTableRelevantTeam(team = {}) {
  const value = normalizeTeamAgeGroup(team);

  if (
    value.includes("bambini") ||
    value.includes("f-jugend") ||
    value.includes("f1") ||
    value.includes("f2") ||
    value.includes("e-jugend") ||
    value.includes("e1") ||
    value.includes("e2")
  ) {
    return false;
  }

  return true;
}

export function isWidgetUrl(url = "") {
  const value = String(url).toLowerCase();

  return (
    value.includes("widget") ||
    value.includes("iframe") ||
    value.includes("embed")
  );
}

export function getTeamSourceUrl(team = {}) {
  return team.fussball_de_team_url || team.fussball_de_matches_url || "";
}

export function getMatchWidgetUrl(team = {}) {
  const url = team.fussball_de_matches_widget_url || team.dfb_matches_widget_url || "";
  return isWidgetUrl(url) ? url : "";
}

export function getTableWidgetUrl(team = {}) {
  const url = team.fussball_de_table_widget_url || team.dfb_table_widget_url || "";
  return isWidgetUrl(url) ? url : "";
}
