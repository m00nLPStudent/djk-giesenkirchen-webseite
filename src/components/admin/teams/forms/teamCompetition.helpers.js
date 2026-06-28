function getUrlValue(url, keys = []) {
  for (const key of keys) {
    const match = url.match(new RegExp(`[?&]${key}=([^&#]+)`, "i"));
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return "";
}

function getPathValue(url, patterns = []) {
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return "";
}

export function parseFussballDeTeamLink(url = "") {
  const value = String(url).trim();

  if (!value) {
    return {
      teamId: "",
      competitionId: "",
      clubId: "",
      matchesUrl: "",
      tableUrl: "",
    };
  }

  const teamId =
    getUrlValue(value, ["team-id", "teamId", "team"]) ||
    getPathValue(value, [/team-id\/([^/?#]+)/i, /mannschaft\/[^/]+\/([^/?#]+)/i]);

  const competitionId =
    getUrlValue(value, ["staffel-id", "staffelId", "competition-id", "competitionId"]) ||
    getPathValue(value, [/staffel-id\/([^/?#]+)/i, /staffel\/([^/?#]+)/i]);

  const clubId =
    getUrlValue(value, ["verein-id", "vereinId", "club-id", "clubId"]) ||
    getPathValue(value, [/verein-id\/([^/?#]+)/i, /verein\/[^/]+\/([^/?#]+)/i]);

  return {
    teamId,
    competitionId,
    clubId,
    matchesUrl: value,
    tableUrl: value,
  };
}

export function applyFussballDeTeamLink(form = {}, url = "") {
  const parsed = parseFussballDeTeamLink(url);

  return {
    ...form,
    fussball_de_team_url: url,
    fussball_de_team_id: parsed.teamId || form.fussball_de_team_id || "",
    fussball_de_competition_id:
      parsed.competitionId || form.fussball_de_competition_id || "",
    fussball_de_club_id: parsed.clubId || form.fussball_de_club_id || "",
    fussball_de_matches_url: parsed.matchesUrl || form.fussball_de_matches_url || "",
    fussball_de_table_url: parsed.tableUrl || form.fussball_de_table_url || "",
    fussball_de_matches_widget_url:
      form.fussball_de_matches_widget_url || parsed.matchesUrl || "",
    fussball_de_table_widget_url:
      form.fussball_de_table_widget_url || parsed.tableUrl || "",
  };
}
