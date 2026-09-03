import "server-only";

const TABLES = { player: "players", coach: "coaches", team: "teams", board: "board_members" };

export async function loadStructureInventory(db) {
  const [departments, players, coaches, teams, board] = await Promise.all([
    db.from("departments").select("id, slug, name_de, is_active").order("name_de"),
    db.from("players").select("id, first_name, last_name, department_id, is_active").order("last_name"),
    db.from("coaches").select("id, first_name, last_name, name, department_id, is_active").order("last_name"),
    db.from("teams").select("id, name_de, slug, department_id, is_active").order("name_de"),
    db.from("board_members").select("id, first_name, last_name, role_de, organization_scope, department_id, is_active").eq("organization_scope", "unassigned").is("department_id", null).order("sort_order"),
  ]);
  const failed = [departments, players, coaches, teams, board].find((result) => result.error);
  if (failed) return { data: null, error: failed.error };
  return { data: { departments: departments.data || [], players: players.data || [], coaches: coaches.data || [], teams: teams.data || [], board: board.data || [] }, error: null };
}

export async function loadStructureRelationConflicts(db) {
  const [players, coaches] = await Promise.all([
    db.from("player_team_seasons").select("id, player_id, team_season_id, players(id, first_name, last_name, department_id, departments(name_de)), team_seasons!inner(id, name_de, teams!inner(id, name_de, department_id, departments(name_de)))").eq("is_active", true),
    db.from("coach_team_seasons").select("id, coach_id, team_season_id, coaches(id, first_name, last_name, name, department_id, departments(name_de)), team_seasons!inner(id, name_de, teams!inner(id, name_de, department_id, departments(name_de)))").eq("is_active", true),
  ]);
  if (players.error || coaches.error) return { data: null, error: players.error || coaches.error };
  return { data: { players: players.data || [], coaches: coaches.data || [] }, error: null };
}

export async function deactivateStructureRelationConflict(db, input) {
  const table = input.entityType === "player" ? "player_team_seasons" : input.entityType === "coach" ? "coach_team_seasons" : null;
  const personColumn = input.entityType === "player" ? "player_id" : "coach_id";
  if (!table) return { data: null, error: { message: "Unbekannter Relationstyp." } };
  return db.from(table).update({ is_active: false }).eq("id", input.relationId).eq(personColumn, input.entityId).eq("is_active", true).select("id");
}

export async function loadStructureRecord(db, entityType, entityId) {
  const table = TABLES[entityType];
  if (!table) return { data: null, error: { message: "Unbekannter Strukturtyp." } };
  const fields = entityType === "board" ? "id, organization_scope, department_id" : "id, department_id";
  return db.from(table).select(fields).eq("id", entityId).maybeSingle();
}

export async function loadActiveDepartment(db, departmentId) {
  return db.from("departments").select("id, slug, name_de, is_active").eq("id", departmentId).eq("is_active", true).maybeSingle();
}

function collectNestedDepartmentIds(rows = []) {
  return rows.flatMap((row) => {
    const teamSeason = Array.isArray(row.team_seasons) ? row.team_seasons[0] : row.team_seasons;
    const team = Array.isArray(teamSeason?.teams) ? teamSeason.teams[0] : teamSeason?.teams;
    return [team?.department_id || null];
  });
}

export async function loadRelatedDepartmentIds(db, entityType, entityId) {
  if (entityType === "player" || entityType === "coach") {
    const table = entityType === "player" ? "player_team_seasons" : "coach_team_seasons";
    const column = entityType === "player" ? "player_id" : "coach_id";
    const result = await db.from(table).select("team_seasons!inner(teams!inner(department_id))").eq(column, entityId).eq("is_active", true);
    return { data: result.error ? [] : collectNestedDepartmentIds(result.data), error: result.error };
  }
  if (entityType !== "team") return { data: [], error: null };

  const seasons = await db.from("team_seasons").select("id").eq("team_id", entityId);
  if (seasons.error) return { data: [], error: seasons.error };
  const ids = (seasons.data || []).map((row) => row.id);
  if (!ids.length) return { data: [], error: null };
  const [players, coaches] = await Promise.all([
    db.from("player_team_seasons").select("players(department_id)").in("team_season_id", ids).eq("is_active", true),
    db.from("coach_team_seasons").select("coaches(department_id)").in("team_season_id", ids).eq("is_active", true),
  ]);
  if (players.error || coaches.error) return { data: [], error: players.error || coaches.error };
  const departmentOf = (value) => (Array.isArray(value) ? value[0] : value)?.department_id || null;
  const values = [...(players.data || []).map((row) => departmentOf(row.players)), ...(coaches.data || []).map((row) => departmentOf(row.coaches))];
  return { data: values, error: null };
}

export async function assignUnassignedStructureRecord(db, assignment) {
  const table = TABLES[assignment.entityType];
  const payload = assignment.entityType === "board"
    ? { organization_scope: assignment.targetType === "club" ? "club" : "department", department_id: assignment.departmentId }
    : { department_id: assignment.departmentId };
  let query = db.from(table).update(payload).eq("id", assignment.entityId).is("department_id", null);
  if (assignment.entityType === "board") query = query.eq("organization_scope", "unassigned");
  return query.select("id");
}
