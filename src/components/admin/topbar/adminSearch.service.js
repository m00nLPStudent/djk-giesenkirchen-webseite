import { supabase } from "@/lib/supabase";

function normalize(value) {
  if (value === null || value === undefined) return "";
  return String(value).toLowerCase().trim();
}

function matches(value, query) {
  return normalize(value).includes(normalize(query));
}

function mapResult({ type, title, subtitle, href }) {
  return { type, title, subtitle, href };
}

export async function searchAdminEntities(query) {
  const search = normalize(query);
  if (search.length < 2) return [];

  const [news, teams, players, coaches, sponsors, boardMembers] = await Promise.all([
    supabase.from("news").select("id, title_de, category").limit(20),
    supabase.from("teams").select("id, name_de, age_group").limit(20),
    supabase.from("players").select("id, first_name, last_name, team_id").limit(20),
    supabase.from("coaches").select("id, first_name, last_name, name, team_name").limit(20),
    supabase.from("sponsors").select("id, name").limit(20),
    supabase.from("board_members").select("id, first_name, last_name, role_de").limit(20),
  ]);

  const results = [];

  (news.data || [])
    .filter((item) => matches(item.title_de, search) || matches(item.category, search))
    .forEach((item) => results.push(mapResult({ type: "News", title: item.title_de || "Ohne Titel", subtitle: item.category || "News", href: `/admin/news/edit/${item.id}` })));

  (teams.data || [])
    .filter((item) => matches(item.name_de, search) || matches(item.age_group, search))
    .forEach((item) => results.push(mapResult({ type: "Mannschaft", title: item.name_de || "Mannschaft", subtitle: item.age_group || "Team", href: `/admin/teams/edit/${item.id}` })));

  (players.data || [])
    .filter((item) => matches(`${item.first_name || ""} ${item.last_name || ""}`, search))
    .forEach((item) => results.push(mapResult({ type: "Spieler", title: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Spieler", subtitle: "Spielerprofil", href: `/admin/players/edit/${item.id}` })));

  (coaches.data || [])
    .filter((item) => matches(`${item.first_name || ""} ${item.last_name || ""} ${item.name || ""}`, search) || matches(item.team_name, search))
    .forEach((item) => results.push(mapResult({ type: "Trainer", title: `${item.first_name || ""} ${item.last_name || ""}`.trim() || item.name || "Trainer", subtitle: item.team_name || "Trainer", href: `/admin/coaches/edit/${item.id}` })));

  (sponsors.data || [])
    .filter((item) => matches(item.name, search))
    .forEach((item) => results.push(mapResult({ type: "Sponsor", title: item.name || "Sponsor", subtitle: "Sponsor", href: `/admin/sponsors/edit/${item.id}` })));

  (boardMembers.data || [])
    .filter((item) => matches(`${item.first_name || ""} ${item.last_name || ""}`, search) || matches(item.role_de, search))
    .forEach((item) => results.push(mapResult({ type: "Vorstand", title: `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Vorstand", subtitle: item.role_de || "Vorstand", href: `/admin/department/board/edit/${item.id}` })));

  return results.slice(0, 8);
}
