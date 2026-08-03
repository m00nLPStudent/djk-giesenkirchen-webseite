import "server-only";

export async function loadTeamRosterNotificationSnapshot(db, teamId, seasonId) {
  if (!teamId || !seasonId) return { data: null, error: null };
  const season = await db.from("seasons").select("id, name").eq("id", seasonId).maybeSingle();
  const teamSeason = await db.from("team_seasons").select("id, team_id, season_id, name_de").eq("team_id", teamId).eq("season_id", seasonId).maybeSingle();
  if (season.error || teamSeason.error || !teamSeason.data) return { data: null, error: season.error || teamSeason.error };
  const [playerLinks, coachLinks] = await Promise.all([
    db.from("player_team_seasons").select("id, player_id, team_season_id, is_active").eq("team_season_id", teamSeason.data.id).eq("is_active", true),
    db.from("coach_team_seasons").select("id, coach_id, team_season_id, role_de, is_active").eq("team_season_id", teamSeason.data.id).eq("is_active", true),
  ]);
  if (playerLinks.error || coachLinks.error) return { data: null, error: playerLinks.error || coachLinks.error };
  const playerIds = (playerLinks.data || []).map((row) => row.player_id).filter(Boolean);
  const coachIds = (coachLinks.data || []).map((row) => row.coach_id).filter(Boolean);
  const [players, coaches] = await Promise.all([
    playerIds.length ? db.from("players").select("id, first_name, last_name").in("id", playerIds) : { data: [], error: null },
    coachIds.length ? db.from("coaches").select("id, first_name, last_name, admin_profile_id, is_active").in("id", coachIds) : { data: [], error: null },
  ]);
  if (players.error || coaches.error) return { data: null, error: players.error || coaches.error };
  const playerById = new Map((players.data || []).map((row) => [row.id, row]));
  const coachById = new Map((coaches.data || []).map((row) => [row.id, row]));
  const base = { teamId, teamSeasonId: teamSeason.data.id, teamNameDe: teamSeason.data.name_de, seasonId, seasonName: season.data?.name || null };
  return { data: {
    ...base,
    players: (playerLinks.data || []).map((link) => ({ ...playerById.get(link.player_id), ...base, assignmentId: link.id })),
    coaches: (coachLinks.data || []).map((link) => ({ ...coachById.get(link.coach_id), ...base, roleDe: link.role_de, assignmentId: link.id })),
  }, error: null };
}
