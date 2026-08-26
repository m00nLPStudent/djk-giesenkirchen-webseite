const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateTeamDepartmentId(value) {
  const departmentId = typeof value === "string" ? value.trim() : "";
  return UUID_PATTERN.test(departmentId)
    ? { data: departmentId, error: null }
    : { data: null, error: { message: "Bitte eine gültige Abteilung auswählen." } };
}

export function validateActiveTeamDepartment(value, department) {
  const normalized = validateTeamDepartmentId(value);
  if (normalized.error) return normalized;
  if (!department || department.id !== normalized.data || department.is_active !== true) {
    return { data: null, error: { message: "Die ausgewählte Abteilung existiert nicht oder ist inaktiv." } };
  }
  return { data: department.id, error: null };
}
