import { supabase } from "@/lib/supabase";

const TEAM_FIELDS =
  "id, slug, name_de, name_en, age_group, training_times_de, team_image_url, is_active, sort_order";

export function getFootballTeamGroup(team = {}) {
  const value =
    `${team.age_group || ""} ${team.name_de || ""} ${team.name_en || ""}`
      .toLowerCase()
      .trim();

  if (/(damen|frauen|women|ladies)/.test(value)) {
    return "damen";
  }

  if (/(senior|herren|men|alte\s*herren)/.test(value)) {
    return "senioren";
  }

  if (/(jugend|bambini|mini|u\s?-?\d{1,2}|[a-f]\s?-?jugend)/.test(value)) {
    return "junioren";
  }

  return "junioren";
}

export async function getActiveFootballTeams() {
  const result = await supabase
    .from("teams")
    .select(TEAM_FIELDS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_de", { ascending: true });

  return result;
}

export function groupFootballTeams(teams = []) {
  return teams.reduce(
    (groups, team) => {
      const key = getFootballTeamGroup(team);
      groups[key].push(team);
      return groups;
    },
    { junioren: [], senioren: [], damen: [] },
  );
}
