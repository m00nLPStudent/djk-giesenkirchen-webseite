export const BOARD_RESPONSIBILITY_LIMIT = 10;
export const BOARD_RESPONSIBILITY_MAX_LENGTH = 200;

const text = (value) => String(value || "").trim();

export function normalizeBoardResponsibilities(values = []) {
  const responsibilities = (Array.isArray(values) ? values : [])
    .map(text)
    .filter(Boolean);
  if (responsibilities.length > BOARD_RESPONSIBILITY_LIMIT) {
    return { ok: false, message: `Es sind maximal ${BOARD_RESPONSIBILITY_LIMIT} Aufgaben erlaubt.` };
  }
  if (responsibilities.some((value) => value.length > BOARD_RESPONSIBILITY_MAX_LENGTH)) {
    return { ok: false, message: `Eine Aufgabe darf maximal ${BOARD_RESPONSIBILITY_MAX_LENGTH} Zeichen lang sein.` };
  }
  return { ok: true, data: responsibilities };
}

export function normalizeBoardResponsibilityTarget({ organization_scope, department_id, role_id } = {}) {
  const scope = text(organization_scope);
  const departmentId = text(department_id) || null;
  const roleId = text(role_id);
  if (!roleId) return { ok: false, message: "Bitte eine Funktion auswählen." };
  if (scope === "club" && departmentId === null) return { ok: true, data: { organization_scope: scope, department_id: null, role_id: roleId } };
  if (scope === "department" && departmentId) return { ok: true, data: { organization_scope: scope, department_id: departmentId, role_id: roleId } };
  return { ok: false, message: "Der Organisationsbereich für die Aufgaben ist ungültig." };
}

export function boardResponsibilityKey(value = {}) {
  const target = normalizeBoardResponsibilityTarget(value);
  return target.ok ? `${target.data.organization_scope}:${target.data.department_id || "club"}:${target.data.role_id}` : "";
}

export function findBoardResponsibilities(configurations = [], target = {}) {
  const key = boardResponsibilityKey(target);
  if (!key) return [];
  const match = configurations.find((item) => boardResponsibilityKey(item) === key);
  return normalizeBoardResponsibilities(match?.responsibilities || []).data || [];
}
