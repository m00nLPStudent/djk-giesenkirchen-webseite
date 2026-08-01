import { planTeamCoachAssignmentSync } from "@/components/admin/teams/teamCoachAssignments.core.mjs";

async function loadTeamCoachAssignments(db, teamSeasonId) {
  const { data, error } = await db
    .from("coach_team_seasons")
    .select("id, coach_id, team_season_id, role_de, role_en, sort_order, is_active, created_at")
    .eq("team_season_id", teamSeasonId);

  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

async function loadCoachesByIds(db, coachIds = []) {
  const normalizedIds = Array.from(new Set((coachIds || []).filter(Boolean)));
  if (!normalizedIds.length) return { data: [], error: null };

  const { data, error } = await db
    .from("coaches")
    .select("id, role, role_de, role_en, sort_order")
    .in("id", normalizedIds);

  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

async function loadTeamSeason(db, teamSeasonId) {
  if (!teamSeasonId) return { data: null, error: null };

  const { data, error } = await db
    .from("team_seasons")
    .select("id, season_id")
    .eq("id", teamSeasonId)
    .maybeSingle();

  return { data: data || null, error };
}

async function loadCurrentSeasonCoachAssignmentsByCoachId(
  db,
  coachIds = [],
  seasonId = null,
) {
  const normalizedIds = Array.from(new Set((coachIds || []).filter(Boolean)));
  if (!normalizedIds.length || !seasonId) {
    return { data: new Map(), error: null };
  }

  const { data: assignments, error: assignmentError } = await db
    .from("coach_team_seasons")
    .select("id, coach_id, team_season_id, role_de, role_en, sort_order, is_active, created_at")
    .in("coach_id", normalizedIds)
    .eq("is_active", true);

  if (assignmentError) {
    return { data: new Map(), error: assignmentError };
  }

  const teamSeasonIds = Array.from(
    new Set((assignments || []).map((row) => row?.team_season_id).filter(Boolean)),
  );
  if (teamSeasonIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const { data: teamSeasons, error: teamSeasonError } = await db
    .from("team_seasons")
    .select("id, season_id")
    .in("id", teamSeasonIds);

  if (teamSeasonError) {
    return { data: new Map(), error: teamSeasonError };
  }

  const currentSeasonTeamSeasonIds = new Set(
    (teamSeasons || [])
      .filter((row) => row?.season_id === seasonId)
      .map((row) => row.id),
  );
  const assignmentsByCoachId = new Map();

  for (const assignment of assignments || []) {
    if (!assignment?.coach_id) continue;
    if (!currentSeasonTeamSeasonIds.has(assignment.team_season_id)) continue;

    const current = assignmentsByCoachId.get(assignment.coach_id) || [];
    current.push(assignment);
    assignmentsByCoachId.set(assignment.coach_id, current);
  }

  return { data: assignmentsByCoachId, error: null };
}

export async function syncTeamCoachAssignments(
  db,
  teamSeasonId,
  selectedCoachIds = [],
) {
  const existingAssignmentsResult = await loadTeamCoachAssignments(db, teamSeasonId);
  if (existingAssignmentsResult.error) {
    return existingAssignmentsResult;
  }

  const coachesResult = await loadCoachesByIds(db, selectedCoachIds);
  if (coachesResult.error) {
    return coachesResult;
  }

  const teamSeasonResult = await loadTeamSeason(db, teamSeasonId);
  if (teamSeasonResult.error) {
    return { data: [], error: teamSeasonResult.error };
  }

  const currentSeasonAssignmentsResult =
    await loadCurrentSeasonCoachAssignmentsByCoachId(
      db,
      selectedCoachIds,
      teamSeasonResult.data?.season_id || null,
    );
  if (currentSeasonAssignmentsResult.error) {
    return { data: [], error: currentSeasonAssignmentsResult.error };
  }

  const plan = planTeamCoachAssignmentSync({
    existingAssignments: existingAssignmentsResult.data,
    selectedCoachIds,
    coachesById: new Map(
      (coachesResult.data || []).map((coach) => [coach.id, coach]),
    ),
    currentSeasonAssignmentsByCoachId: currentSeasonAssignmentsResult.data,
    teamSeasonId,
  });

  if (plan.deactivateIds.length > 0) {
    const deactivateResult = await db
      .from("coach_team_seasons")
      .update({ is_active: false })
      .in("id", plan.deactivateIds);

    if (deactivateResult.error) return deactivateResult;
  }

  if (plan.reactivateIds.length > 0) {
    const reactivateResult = await db
      .from("coach_team_seasons")
      .update({ is_active: true })
      .in("id", plan.reactivateIds);

    if (reactivateResult.error) return reactivateResult;
  }

  if (plan.createRows.length === 0) {
    return { error: null };
  }

  return await db.from("coach_team_seasons").insert(plan.createRows);
}
