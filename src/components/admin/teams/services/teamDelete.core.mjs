function buildSuccess(outcome, message, details = null) {
  return {
    error: null,
    outcome,
    message,
    details,
  };
}

function buildError(message) {
  return { error: { message } };
}

export function isForeignKeyBlockError(error) {
  const code = String(error?.code || "").toUpperCase();
  if (code === "23503") {
    return true;
  }

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("foreign key") || message.includes("violates foreign key")
  );
}

async function countEq(db, table, key, value) {
  const { count, error } = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(key, value);

  if (error) {
    return { count: 0, error };
  }

  return { count: Number(count || 0), error: null };
}

async function countIn(db, table, key, values = []) {
  if (!values.length) {
    return { count: 0, error: null };
  }

  const { count, error } = await db
    .from(table)
    .select("id", { count: "exact", head: true })
    .in(key, values);

  if (error) {
    return { count: 0, error };
  }

  return { count: Number(count || 0), error: null };
}

async function loadIdsByEq(db, table, idColumn, key, value) {
  const { data, error } = await db.from(table).select(idColumn).eq(key, value);

  if (error) {
    return { ids: [], error };
  }

  return {
    ids: (data || []).map((row) => row?.[idColumn]).filter(Boolean),
    error: null,
  };
}

async function loadIdsByIn(db, table, idColumn, key, values = []) {
  if (!values.length) {
    return { ids: [], error: null };
  }

  const { data, error } = await db.from(table).select(idColumn).in(key, values);

  if (error) {
    return { ids: [], error };
  }

  return {
    ids: (data || []).map((row) => row?.[idColumn]).filter(Boolean),
    error: null,
  };
}

function countUniqueIds(ids = []) {
  return uniqueIds(ids).length;
}

function uniqueIds(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export async function loadTeamDependencySummary(db, teamId) {
  const teamSeasonIdsResult = await loadIdsByEq(
    db,
    "team_seasons",
    "id",
    "team_id",
    teamId,
  );
  if (teamSeasonIdsResult.error) {
    return {
      summary: null,
      hasDependencies: false,
      error: teamSeasonIdsResult.error,
    };
  }

  const teamSeasonIds = teamSeasonIdsResult.ids;
  const [
    news,
    teamSeasons,
    events,
    membershipRequests,
    playerTeamSeasons,
    coachTeamSeasons,
    teamTrainingTimes,
    clubClosurePeriods,
  ] = await Promise.all([
    countEq(db, "news", "football_team_id", teamId),
    countEq(db, "team_seasons", "team_id", teamId),
    countEq(db, "events", "team_id", teamId),
    countEq(db, "membership_requests", "desired_team_id", teamId),
    countIn(db, "player_team_seasons", "team_season_id", teamSeasonIds),
    countIn(db, "coach_team_seasons", "team_season_id", teamSeasonIds),
    countIn(db, "team_training_times", "team_season_id", teamSeasonIds),
    countIn(db, "club_closure_periods", "team_season_id", teamSeasonIds),
  ]);

  const dependencyError = [
    news,
    teamSeasons,
    events,
    membershipRequests,
    playerTeamSeasons,
    coachTeamSeasons,
    teamTrainingTimes,
    clubClosurePeriods,
  ].find((item) => item.error)?.error;

  if (dependencyError) {
    return { summary: null, hasDependencies: false, error: dependencyError };
  }

  const trainingTimeIdsResult = await loadIdsByIn(
    db,
    "team_training_times",
    "id",
    "team_season_id",
    teamSeasonIds,
  );
  if (trainingTimeIdsResult.error) {
    return {
      summary: null,
      hasDependencies: false,
      error: trainingTimeIdsResult.error,
    };
  }

  const teamTrainingExceptions = await countIn(
    db,
    "team_training_exceptions",
    "team_training_time_id",
    trainingTimeIdsResult.ids,
  );

  if (teamTrainingExceptions.error) {
    return {
      summary: null,
      hasDependencies: false,
      error: teamTrainingExceptions.error,
    };
  }

  const playerIdsResult = await loadIdsByIn(
    db,
    "player_team_seasons",
    "player_id",
    "team_season_id",
    teamSeasonIds,
  );
  if (playerIdsResult.error) {
    return {
      summary: null,
      hasDependencies: false,
      error: playerIdsResult.error,
    };
  }

  const summary = {
    coaches: coachTeamSeasons.count,
    players: countUniqueIds(playerIdsResult.ids),
    news: news.count,
    teamSeasons: teamSeasons.count,
    events: events.count,
    membershipRequests: membershipRequests.count,
    playerTeamSeasons: playerTeamSeasons.count,
    coachTeamSeasons: coachTeamSeasons.count,
    teamTrainingTimes: teamTrainingTimes.count,
    clubClosurePeriods: clubClosurePeriods.count,
    teamTrainingExceptions: teamTrainingExceptions.count,
  };

  const hasDependencies = Object.values(summary).some((value) => value > 0);
  return { summary, hasDependencies, error: null };
}

export async function executeSafeTeamDeleteOrArchiveCore(
  db,
  team,
  {
    archiveTeam,
    hardDeleteTeam,
    loadDependencies = loadTeamDependencySummary,
  },
) {
  const dependencyResult = await loadDependencies(db, team?.id);

  if (dependencyResult.error) {
    return buildError(
      "Die Teamzuordnungen konnten nicht geprueft werden. Bitte erneut versuchen.",
    );
  }

  if (dependencyResult.hasDependencies) {
    const archiveResult = await archiveTeam(db, team?.id);
    if (archiveResult.error) {
      return buildError("Die Mannschaft konnte nicht archiviert werden.");
    }

    return buildSuccess(
      "archived",
      "Die Mannschaft enthaelt bereits zugehoerige Daten und wurde daher archiviert.",
      dependencyResult.summary,
    );
  }

  const deleteResult = await hardDeleteTeam(db, team);
  if (deleteResult.error) {
    if (isForeignKeyBlockError(deleteResult.error)) {
      const archiveResult = await archiveTeam(db, team?.id);
      if (archiveResult.error) {
        return buildError(
          "Die Mannschaft konnte weder geloescht noch archiviert werden.",
        );
      }

      return buildSuccess(
        "archived",
        "Die Mannschaft enthaelt bereits zugehoerige Daten und wurde daher archiviert.",
        dependencyResult.summary,
      );
    }

    return buildError(
      "Die Mannschaft konnte nicht endgueltig geloescht werden.",
    );
  }

  return buildSuccess("deleted", "Mannschaft wurde endgueltig geloescht.");
}
