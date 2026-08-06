import "server-only";

function normalizeText(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function createServiceError(message, code) {
  return { message, code };
}

export async function loadPlayerMasterRecord(db, playerId) {
  const { data, error } = await db
    .from("players")
    .select("id, first_name, last_name, image_url, photo_url, image_media_asset_id, is_active, description_de, description_en, birthdate, joined_at, year_group, strong_foot, nationality, gender")
    .eq("id", playerId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: createServiceError(
        `Der Spieler konnte nicht geladen werden: ${error.message}`,
        "PLAYER_LOAD_FAILED",
      ),
    };
  }

  return { data: data || null, error: null };
}

export async function loadPlayerCurrentSeasonAssignmentRows(
  db,
  playerId,
  seasonId,
) {
  const { data: teamSeasons, error: teamSeasonError } = await db
    .from("team_seasons")
    .select("id, team_id, name_de, name_en, slug, age_group")
    .eq("season_id", seasonId);

  if (teamSeasonError) {
    return {
      data: [],
      error: createServiceError(
        `Die Team-Saisons konnten nicht geladen werden: ${teamSeasonError.message}`,
        "PLAYER_TEAM_SEASONS_LOAD_FAILED",
      ),
    };
  }

  const teamSeasonIds = (teamSeasons || [])
    .map((teamSeason) => teamSeason?.id)
    .filter(Boolean);

  if (teamSeasonIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: assignments, error: assignmentError } = await db
    .from("player_team_seasons")
    .select("id, player_id, team_season_id, shirt_number, position_de, position_en, is_captain, is_active, sort_order, created_at")
    .eq("player_id", playerId)
    .in("team_season_id", teamSeasonIds);

  if (assignmentError) {
    return {
      data: [],
      error: createServiceError(
        `Die aktuellen Spielerzuordnungen konnten nicht geladen werden: ${assignmentError.message}`,
        "PLAYER_ASSIGNMENTS_LOAD_FAILED",
      ),
    };
  }

  const teamSeasonById = new Map(
    (teamSeasons || []).map((teamSeason) => [teamSeason.id, teamSeason]),
  );

  return {
    data: (assignments || [])
      .flatMap((assignment) => {
        const teamSeason = teamSeasonById.get(assignment?.team_season_id);
        if (!teamSeason) return [];

        return [
          {
            playerTeamSeasonId: assignment.id,
            playerId: assignment.player_id,
            teamSeasonId: teamSeason.id,
            teamId: teamSeason.team_id || null,
            teamNameDe: normalizeText(teamSeason.name_de),
            teamNameEn: normalizeText(teamSeason.name_en),
            teamSlug: normalizeText(teamSeason.slug),
            ageGroup: normalizeText(teamSeason.age_group),
            shirtNumber: assignment.shirt_number ?? null,
            positionDe: normalizeText(assignment.position_de),
            positionEn: normalizeText(assignment.position_en),
            isCaptain: Boolean(assignment.is_captain),
            isActive: assignment.is_active !== false,
            sortOrder: assignment.sort_order ?? 0,
            createdAt: assignment.created_at ?? null,
          },
        ];
      }),
    error: null,
  };
}

export async function insertPlayerMaster(db, payload) {
  const { data, error } = await db.from("players").insert(payload).select("*");
  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? createServiceError(
          `Die Player-Stammdaten konnten nicht gespeichert werden: ${error.message}`,
          "PLAYER_MASTER_INSERT_FAILED",
        )
      : null,
  };
}

export async function updatePlayerMaster(db, playerId, payload) {
  const { data, error } = await db
    .from("players")
    .update(payload)
    .eq("id", playerId)
    .select("*");

  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? createServiceError(
          `Die Player-Stammdaten konnten nicht aktualisiert werden: ${error.message}`,
          "PLAYER_MASTER_UPDATE_FAILED",
        )
      : null,
  };
}

export async function deletePlayerMaster(db, playerId) {
  const { error } = await db.from("players").delete().eq("id", playerId);
  return error
    ? createServiceError(
        `Der neu angelegte Spieler konnte nach einem Zuordnungsfehler nicht automatisch zurueckgerollt werden: ${error.message}`,
        "PLAYER_CREATE_ROLLBACK_FAILED",
      )
    : null;
}

export async function insertPlayerAssignment(db, playerId, payload) {
  const { data, error } = await db
    .from("player_team_seasons")
    .insert({ ...payload, player_id: playerId })
    .select("id");

  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? createServiceError(
          `Die Saisonzuordnung konnte nicht erstellt werden: ${error.message}`,
          "PLAYER_ASSIGNMENT_INSERT_FAILED",
        )
      : null,
  };
}

export async function updatePlayerAssignment(db, assignmentId, payload) {
  const { error } = await db
    .from("player_team_seasons")
    .update(payload)
    .eq("id", assignmentId);

  return error
    ? createServiceError(
        `Die Saisonzuordnung konnte nicht aktualisiert werden: ${error.message}`,
        "PLAYER_ASSIGNMENT_UPDATE_FAILED",
      )
    : null;
}

export async function setPlayerAssignmentActive(db, assignmentId, isActive) {
  const { error } = await db
    .from("player_team_seasons")
    .update({ is_active: isActive })
    .eq("id", assignmentId);

  return error
    ? createServiceError(
        `Die bestehende Saisonzuordnung konnte nicht umgeschaltet werden: ${error.message}`,
        "PLAYER_ASSIGNMENT_TOGGLE_FAILED",
      )
    : null;
}
