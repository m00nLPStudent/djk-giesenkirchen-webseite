export const STRUCTURE_ENTITY_TYPES = Object.freeze(["player", "coach", "team", "board"]);

export function resolveStructureRecordScope(entityType, record, playerAssignments = []) {
  if (!record) return "unassigned";
  if (entityType === "board") return record.organization_scope === "unassigned" && !record.department_id ? "unassigned" : record.organization_scope;
  if (!record.department_id) return "unassigned";
  if (entityType !== "player") return "department";

  const assignments = (playerAssignments || []).filter((assignment) => assignment?.playerId === record.id);
  if (!assignments.length) return "teamless";
  if (assignments.some((assignment) => assignment.departmentId !== record.department_id)) return "conflict";
  return "department";
}

export function filterStructureItems(items = [], { type = "all", scope = "unassigned", status = "all" } = {}) {
  return items.filter((item) => {
    if (type !== "all" && item.type !== type) return false;
    if (status === "active" && item.is_active === false) return false;
    if (status === "inactive" && item.is_active !== false) return false;
    if (scope === "all") return true;
    if (scope === "assigned") return item.scope === "department" || item.scope === "club";
    return item.scope === scope;
  });
}

export function normalizeStructureAssignmentInput(input = {}) {
  const entityType = String(input.entityType || "").trim();
  const entityId = String(input.entityId || "").trim();
  const targetType = String(input.targetType || "department").trim();
  const departmentId = String(input.departmentId || "").trim() || null;

  if (!STRUCTURE_ENTITY_TYPES.includes(entityType) || !entityId) {
    return { ok: false, message: "Die Zuordnungsanfrage ist ungueltig." };
  }
  if (targetType === "club") {
    if (entityType !== "board" || departmentId) return { ok: false, message: "Gesamtverein ist nur fuer Vorstandseintraege zulaessig." };
    return { ok: true, data: { entityType, entityId, targetType, departmentId: null } };
  }
  if (targetType !== "department" || !departmentId) {
    return { ok: false, message: "Bitte eine aktive Zielabteilung auswaehlen." };
  }
  return { ok: true, data: { entityType, entityId, targetType, departmentId } };
}

export function validateRelationCompatibility(targetDepartmentId, relatedDepartmentIds = []) {
  const relations = [...new Set((relatedDepartmentIds || []).map((value) => value || null))];
  if (relations.length === 0) return { ok: true };
  if (relations.some((departmentId) => !departmentId || departmentId !== targetDepartmentId)) {
    return { ok: false, message: "Dieser Datensatz besitzt noch eine Mannschaftszuordnung in einer anderen oder ungeklärten Abteilung. Löse zuerst die bestehende Mannschaftszuordnung unter System → Struktur & Zuordnung." };
  }
  return { ok: true };
}

export function normalizeStructureRelationConflict(entityType, row = {}) {
  const personKey = entityType === "player" ? "players" : "coaches";
  const person = Array.isArray(row[personKey]) ? row[personKey][0] : row[personKey];
  const teamSeason = Array.isArray(row.team_seasons) ? row.team_seasons[0] : row.team_seasons;
  const team = Array.isArray(teamSeason?.teams) ? teamSeason.teams[0] : teamSeason?.teams;
  if (!person || !team || person.department_id === team.department_id) return null;
  const personDepartment = Array.isArray(person.departments) ? person.departments[0] : person.departments;
  const teamDepartment = Array.isArray(team.departments) ? team.departments[0] : team.departments;
  return {
    id: row.id, entityType, entityId: person.id,
    label: person.name || [person.first_name, person.last_name].filter(Boolean).join(" ") || "Unbekannter Datensatz",
    personDepartmentLabel: personDepartment?.name_de || "Nicht zugeordnet",
    teamName: team.name_de || teamSeason?.name_de || "Unbekannte Mannschaft",
    teamDepartmentLabel: teamDepartment?.name_de || "Nicht zugeordnet",
    reason: person.department_id ? "Organisatorische Abteilung und Mannschaftsabteilung stimmen nicht überein." : `${entityType === "player" ? "Spieler" : "Trainer"} ist keiner Abteilung zugeordnet, besitzt aber noch eine Mannschaftsrelation.`,
  };
}

export function isUnassignedStructureRecord(entityType, record) {
  if (!record) return false;
  if (entityType === "board") return record.organization_scope === "unassigned" && !record.department_id;
  return !record.department_id;
}
