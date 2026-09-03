function normalizeText(value = "") {
  return String(value || "").trim();
}

function getCoachCardName(row = {}, coachDto = null) {
  if (coachDto?.displayName) return coachDto.displayName;

  const name =
    normalizeText(row.name) ||
    [row.first_name, row.last_name].map(normalizeText).filter(Boolean).join(" ");

  return name || "Trainer";
}

export function buildBoardCardLabel(row = {}) {
  const name = [row.first_name, row.last_name]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
  const role = normalizeText(row.role_de);
  return [name || "Vorstand", role].filter(Boolean).join(" - ");
}

export function buildCoachCardLabel(row = {}, coachDto = null) {
  const roleText = (coachDto?.roleLabels || []).join(", ");
  return [getCoachCardName(row, coachDto), roleText].filter(Boolean).join(" - ");
}

export function createCardRow(row = {}, type, { coachDto = null } = {}) {
  const normalized = {
    id: row.id || null,
    type,
    email: row.email || null,
    admin_profile_id: row.admin_profile_id || null,
    is_active: row.is_active !== false,
    label:
      type === "board"
        ? buildBoardCardLabel(row)
        : buildCoachCardLabel(row, coachDto),
  };

  if (type === "board") {
    normalized.organizationScope = row.organization_scope || null;
    normalized.departmentId = row.department_id || null;
  }

  return normalized;
}

export function normalizeEmailForCardMatching(value = "") {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}
