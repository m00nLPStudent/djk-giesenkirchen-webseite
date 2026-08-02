import {
  ARCHIVE_CODES,
  archiveResult,
  runArchiveSteps,
  summarizeOutstandingContributions,
} from "./archiveCore.mjs";

async function rows(db, table, columns, filters = []) {
  let query = db.from(table).select(columns);
  for (const [key, value] of filters) query = query.eq(key, value);
  const result = await query;
  if (result.error) throw result.error;
  return result.data || [];
}

async function updateIds(db, table, ids, payload) {
  if (!ids.length) return;
  const { error } = await db.from(table).update(payload).in("id", ids);
  if (error) throw error;
}

async function restoreRows(db, table, snapshots) {
  for (const snapshot of snapshots) {
    const { id, ...payload } = snapshot;
    const { error } = await db.from(table).update(payload).eq("id", id);
    if (error) throw error;
  }
}

async function resolveCurrentSeason(db) {
  const seasons = await rows(db, "seasons", "id", [["is_current", true]]);
  if (!seasons.length) return archiveResult(ARCHIVE_CODES.CURRENT_SEASON_MISSING, "Keine aktuelle Saison gefunden.");
  if (seasons.length > 1) return archiveResult(ARCHIVE_CODES.CURRENT_SEASON_AMBIGUOUS, "Die aktuelle Saison ist nicht eindeutig.");
  return { ok: true, seasonId: seasons[0].id };
}

export async function loadPlayerArchivePreview(db, playerId) {
  const contributions = await rows(
    db,
    "player_contributions",
    "id, status, amount_outstanding",
    [["player_id", playerId]],
  );
  return summarizeOutstandingContributions(contributions);
}

export async function archiveTeam(db, teamId) {
  try {
    const teams = await rows(db, "teams", "id, is_active", [["id", teamId]]);
    const team = teams[0];
    if (!team) return archiveResult(ARCHIVE_CODES.NOT_FOUND, "Mannschaft nicht gefunden.");
    if (team.is_active === false) return archiveResult(ARCHIVE_CODES.TEAM_ALREADY_INACTIVE, "Die Mannschaft ist bereits archiviert.");
    const season = await resolveCurrentSeason(db);
    if (!season.ok) return season;
    const teamSeasons = await rows(db, "team_seasons", "id, is_active", [
      ["team_id", teamId], ["season_id", season.seasonId],
    ]);
    if (teamSeasons.length !== 1) {
      return archiveResult(ARCHIVE_CODES.TEAM_SEASON_NOT_FOUND, "Die aktuelle Mannschaftssaison ist nicht eindeutig aufloesbar.");
    }
    const teamSeason = teamSeasons[0];
    const playerLinks = await rows(db, "player_team_seasons", "id, is_active", [["team_season_id", teamSeason.id], ["is_active", true]]);
    const coachLinks = await rows(db, "coach_team_seasons", "id, is_active", [["team_season_id", teamSeason.id], ["is_active", true]]);
    const rollback = async () => {
      await restoreRows(db, "player_team_seasons", playerLinks);
      await restoreRows(db, "coach_team_seasons", coachLinks);
      await restoreRows(db, "team_seasons", [teamSeason]);
      await restoreRows(db, "teams", [team]);
    };
    const failure = await runArchiveSteps([
      () => updateIds(db, "player_team_seasons", playerLinks.map((row) => row.id), { is_active: false }),
      () => updateIds(db, "coach_team_seasons", coachLinks.map((row) => row.id), { is_active: false }),
      () => updateIds(db, "team_seasons", [teamSeason.id], { is_active: false }),
      () => updateIds(db, "teams", [team.id], { is_active: false }),
      async () => {
        const remainingPlayers = await rows(db, "player_team_seasons", "id", [["team_season_id", teamSeason.id], ["is_active", true]]);
        const remainingCoaches = await rows(db, "coach_team_seasons", "id", [["team_season_id", teamSeason.id], ["is_active", true]]);
        const teamPost = await rows(db, "teams", "id, is_active", [["id", team.id]]);
        const seasonPost = await rows(db, "team_seasons", "id, is_active", [["id", teamSeason.id]]);
        if (remainingPlayers.length || remainingCoaches.length || teamPost[0]?.is_active !== false || seasonPost[0]?.is_active !== false) {
          throw new Error("postcheck");
        }
      },
    ], rollback);
    return failure || archiveResult(ARCHIVE_CODES.SUCCESS, "Mannschaft wurde archiviert.", { playerAssignments: playerLinks.length, coachAssignments: coachLinks.length });
  } catch {
    return archiveResult(ARCHIVE_CODES.DATABASE_ERROR, "Die Mannschaft konnte nicht archiviert werden.");
  }
}

export async function archivePlayer(db, playerId) {
  try {
    const players = await rows(db, "players", "id, is_active", [["id", playerId]]);
    const player = players[0];
    if (!player) return archiveResult(ARCHIVE_CODES.NOT_FOUND, "Spieler nicht gefunden.");
    if (player.is_active === false) return archiveResult(ARCHIVE_CODES.PLAYER_ALREADY_INACTIVE, "Der Spieler ist bereits archiviert.");
    const season = await resolveCurrentSeason(db);
    if (!season.ok) return season;
    const teamSeasons = await rows(db, "team_seasons", "id", [["season_id", season.seasonId]]);
    const links = teamSeasons.length
      ? await db.from("player_team_seasons").select("id, is_active").eq("player_id", playerId).eq("is_active", true).in("team_season_id", teamSeasons.map((row) => row.id))
      : { data: [], error: null };
    if (links.error) throw links.error;
    const snapshots = links.data || [];
    const outstanding = await loadPlayerArchivePreview(db, playerId);
    const rollback = async () => {
      await restoreRows(db, "player_team_seasons", snapshots);
      await restoreRows(db, "players", [player]);
    };
    const failure = await runArchiveSteps([
      () => updateIds(db, "player_team_seasons", snapshots.map((row) => row.id), { is_active: false }),
      () => updateIds(db, "players", [player.id], { is_active: false }),
      async () => {
        const post = await rows(db, "players", "id, is_active", [["id", playerId]]);
        const activeLinks = teamSeasons.length
          ? await db.from("player_team_seasons").select("id").eq("player_id", playerId).eq("is_active", true).in("team_season_id", teamSeasons.map((row) => row.id))
          : { data: [], error: null };
        if (activeLinks.error || activeLinks.data?.length || post[0]?.is_active !== false) throw new Error("postcheck");
      },
    ], rollback);
    return failure || archiveResult(ARCHIVE_CODES.SUCCESS, "Spieler wurde archiviert.", { assignments: snapshots.length, outstanding });
  } catch {
    return archiveResult(ARCHIVE_CODES.DATABASE_ERROR, "Der Spieler konnte nicht archiviert werden.");
  }
}

export async function archiveCoach(db, coachId) {
  try {
    const coaches = await rows(db, "coaches", "id, is_active", [["id", coachId]]);
    const coach = coaches[0];
    if (!coach) return archiveResult(ARCHIVE_CODES.NOT_FOUND, "Trainer nicht gefunden.");
    if (coach.is_active === false) return archiveResult(ARCHIVE_CODES.COACH_ALREADY_INACTIVE, "Der Trainer ist bereits archiviert.");

    const season = await resolveCurrentSeason(db);
    if (!season.ok) return season;
    const teamSeasons = await rows(db, "team_seasons", "id", [["season_id", season.seasonId]]);
    const links = teamSeasons.length
      ? await db.from("coach_team_seasons").select("id, is_active").eq("coach_id", coachId).eq("is_active", true).in("team_season_id", teamSeasons.map((row) => row.id))
      : { data: [], error: null };
    if (links.error) throw links.error;
    const snapshots = links.data || [];

    const rollback = async () => {
      await updateIds(db, "coach_team_seasons", snapshots.map((row) => row.id), { is_active: true });
      await updateIds(db, "coaches", [coach.id], { is_active: coach.is_active });
    };
    const failure = await runArchiveSteps([
      () => updateIds(db, "coach_team_seasons", snapshots.map((row) => row.id), { is_active: false }),
      () => updateIds(db, "coaches", [coach.id], { is_active: false }),
      async () => {
        const post = await rows(db, "coaches", "id, is_active", [["id", coachId]]);
        const activeLinks = teamSeasons.length
          ? await db.from("coach_team_seasons").select("id").eq("coach_id", coachId).eq("is_active", true).in("team_season_id", teamSeasons.map((row) => row.id))
          : { data: [], error: null };
        if (activeLinks.error || activeLinks.data?.length || post[0]?.is_active !== false) throw new Error("postcheck");
      },
    ], rollback);

    return failure || archiveResult(ARCHIVE_CODES.SUCCESS, "Trainer wurde archiviert.", { assignments: snapshots.length });
  } catch {
    return archiveResult(ARCHIVE_CODES.DATABASE_ERROR, "Der Trainer konnte nicht archiviert werden.");
  }
}
