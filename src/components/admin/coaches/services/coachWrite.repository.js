import "server-only";

import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";

function createRepositoryError(message, code) {
  return { message, code };
}

function isCoachTeamSeasonDuplicateError(error) {
  return (
    error?.code === "23505" &&
    String(error?.message || "").includes(
      "coach_team_seasons_coach_id_team_season_id_key",
    )
  );
}

function mapCoachAssignmentWriteError(error, fallbackMessage, fallbackCode) {
  if (isCoachTeamSeasonDuplicateError(error)) {
    return createRepositoryError(
      "Diese Mannschaft ist dem Trainer bereits zugeordnet. Die bestehende Zuordnung wurde nicht doppelt angelegt.",
      "COACH_ASSIGNMENT_ALREADY_EXISTS",
    );
  }

  return createRepositoryError(
    `${fallbackMessage}: ${error.message}`,
    fallbackCode,
  );
}

export async function loadCoachMasterRecord(db, coachId) {
  const { data, error } = await db
    .from("coaches")
    .select("id, first_name, last_name, name, slug, role, role_de, role_en, email, phone, whatsapp, license, team_id, team_name, image_url, photo_url, image_media_asset_id, nationality, sort_order, is_active, department_id")
    .eq("id", coachId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: createRepositoryError(
        `Das Trainerprofil konnte nicht geladen werden: ${error.message}`,
        "COACH_LOAD_FAILED",
      ),
    };
  }

  return { data: data || null, error: null };
}

export async function insertCoachMaster(db, payload) {
  const { data, error } = await db.from("coaches").insert(payload).select("*");
  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? createRepositoryError(
          `Die Trainer-Stammdaten konnten nicht gespeichert werden: ${error.message}`,
          "COACH_MASTER_INSERT_FAILED",
        )
      : null,
  };
}

export async function updateCoachMaster(db, coachId, payload) {
  const { data, error } = await db
    .from("coaches")
    .update(payload)
    .eq("id", coachId)
    .select("*");

  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? createRepositoryError(
          `Die Trainer-Stammdaten konnten nicht aktualisiert werden: ${error.message}`,
          "COACH_MASTER_UPDATE_FAILED",
        )
      : null,
  };
}

export async function deleteCoachMaster(db, coachId) {
  const { error } = await db.from("coaches").delete().eq("id", coachId);
  return error
    ? createRepositoryError(
        `Das neu angelegte Trainerprofil konnte nach einem Zuordnungsfehler nicht automatisch zurueckgerollt werden: ${error.message}`,
        "COACH_CREATE_ROLLBACK_FAILED",
      )
    : null;
}

export async function insertCoachAssignment(db, coachId, payload) {
  const { data, error } = await db
    .from("coach_team_seasons")
    .insert({ ...payload, coach_id: coachId })
    .select("id");

  return {
    data: Array.isArray(data) ? data[0] : data,
    error: error
      ? mapCoachAssignmentWriteError(
          error,
          "Die Trainer-Saisonzuordnung konnte nicht erstellt werden",
          "COACH_ASSIGNMENT_INSERT_FAILED",
        )
      : null,
  };
}

export async function updateCoachAssignment(db, assignmentId, payload) {
  const { error } = await db
    .from("coach_team_seasons")
    .update(payload)
    .eq("id", assignmentId);

  return error
    ? mapCoachAssignmentWriteError(
        error,
        "Die Trainer-Saisonzuordnung konnte nicht aktualisiert werden",
        "COACH_ASSIGNMENT_UPDATE_FAILED",
      )
    : null;
}

export async function setCoachAssignmentActive(db, assignmentId, isActive) {
  const { error } = await db
    .from("coach_team_seasons")
    .update({ is_active: isActive })
    .eq("id", assignmentId);

  return error
    ? createRepositoryError(
        `Die Trainer-Saisonzuordnung konnte nicht umgeschaltet werden: ${error.message}`,
        "COACH_ASSIGNMENT_TOGGLE_FAILED",
      )
    : null;
}

export async function loadCoachCurrentSeasonAssignmentRows(db, coachId) {
  const seasonResolution = await loadCurrentSeasonResolution(db);
  if (!coachId || !seasonResolution?.activeSeasonId) {
    return {
      data: [],
      error: null,
      activeSeasonStatus: seasonResolution?.activeSeasonStatus || null,
    };
  }

  const { data: assignments, error: assignmentError } = await db
    .from("coach_team_seasons")
    .select(
      "id, coach_id, team_season_id, role_de, role_en, sort_order, is_active, created_at",
    )
    .eq("coach_id", coachId);

  if (assignmentError) {
    return {
      data: [],
      error: createRepositoryError(
        `Die Trainer-Saisonzuordnungen konnten nicht geladen werden: ${assignmentError.message}`,
        "COACH_ASSIGNMENT_LOAD_FAILED",
      ),
      activeSeasonStatus: seasonResolution.activeSeasonStatus,
    };
  }

  const teamSeasonIds = Array.from(
    new Set((assignments || []).map((row) => row?.team_season_id).filter(Boolean)),
  );
  if (teamSeasonIds.length === 0) {
    return {
      data: [],
      error: null,
      activeSeasonStatus: seasonResolution.activeSeasonStatus,
    };
  }

  const { data: teamSeasons, error: teamSeasonError } = await db
    .from("team_seasons")
    .select("id, season_id")
    .in("id", teamSeasonIds);

  if (teamSeasonError) {
    return {
      data: [],
      error: createRepositoryError(
        `Die Team-Saisons der Trainerzuordnungen konnten nicht geladen werden: ${teamSeasonError.message}`,
        "COACH_TEAM_SEASON_LOAD_FAILED",
      ),
      activeSeasonStatus: seasonResolution.activeSeasonStatus,
    };
  }

  const currentSeasonTeamSeasonIds = new Set(
    (teamSeasons || [])
      .filter((row) => row?.season_id === seasonResolution.activeSeasonId)
      .map((row) => row.id),
  );

  return {
    data: (assignments || [])
      .filter((row) => currentSeasonTeamSeasonIds.has(row.team_season_id))
      .map((row) => ({
        coachTeamSeasonId: row.id,
        coachId: row.coach_id,
        teamSeasonId: row.team_season_id,
        roleDe: row.role_de || null,
        roleEn: row.role_en || null,
        sortOrder: row.sort_order ?? 0,
        isActive: row.is_active !== false,
        createdAt: row.created_at || null,
      })),
    error: null,
    activeSeasonStatus: seasonResolution.activeSeasonStatus,
  };
}
