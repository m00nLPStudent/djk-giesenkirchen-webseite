import "server-only";

export async function loadActiveTeamSeasonCoaches(db, teamSeasonId) {
  if (!teamSeasonId) return [];

  const { data: assignments, error: assignmentError } = await db
    .from("coach_team_seasons")
    .select("coach_id, role_de, role_en, sort_order, is_active")
    .eq("team_season_id", teamSeasonId)
    .eq("is_active", true);

  if (assignmentError) {
    throw new Error(`Trainerzuordnungen konnten nicht geladen werden: ${assignmentError.message}`);
  }

  const coachIds = Array.from(new Set((assignments || []).map((row) => row.coach_id).filter(Boolean)));
  if (!coachIds.length) return [];

  const { data: coaches, error: coachError } = await db
    .from("coaches")
    .select("id, slug, first_name, last_name, name, image_url, photo_url, license, is_active, sort_order")
    .in("id", coachIds)
    .eq("is_active", true);

  if (coachError) {
    throw new Error(`Trainer konnten nicht geladen werden: ${coachError.message}`);
  }

  const assignmentByCoachId = new Map((assignments || []).map((row) => [row.coach_id, row]));
  return (coaches || []).map((coach) => ({ coach, assignment: assignmentByCoachId.get(coach.id) }));
}
