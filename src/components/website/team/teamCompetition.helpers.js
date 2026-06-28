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

export function getMatchWidgetUrl(team = {}) {
  return (
    team.fussball_de_matches_widget_url ||
    team.fussball_de_matches_url ||
    team.dfb_matches_widget_url ||
    ""
  );
}

export function getTableWidgetUrl(team = {}) {
  return (
    team.fussball_de_table_widget_url ||
    team.fussball_de_table_url ||
    team.dfb_table_widget_url ||
    ""
  );
}
