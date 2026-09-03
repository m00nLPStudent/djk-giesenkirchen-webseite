export const BOARD_ORGANIZATION_SCOPES = Object.freeze({
  CLUB: "club",
  DEPARTMENT: "department",
  UNASSIGNED: "unassigned",
});

const ALLOWED_SCOPES = new Set(Object.values(BOARD_ORGANIZATION_SCOPES));

function normalizeId(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export function validateBoardOrganizationPair({ organizationScope, departmentId } = {}) {
  const scope = String(organizationScope || "").trim();
  const normalizedDepartmentId = normalizeId(departmentId);

  if (!ALLOWED_SCOPES.has(scope)) {
    return { ok: false, message: "Bitte einen gültigen Organisationsbereich auswählen." };
  }
  if (scope === BOARD_ORGANIZATION_SCOPES.DEPARTMENT && !normalizedDepartmentId) {
    return { ok: false, message: "Für einen Abteilungsvorstand ist eine Abteilung erforderlich." };
  }
  if (scope !== BOARD_ORGANIZATION_SCOPES.DEPARTMENT && normalizedDepartmentId) {
    return { ok: false, message: "Gesamtverein und nicht zugeordnete Einträge dürfen keine Abteilung besitzen." };
  }

  return {
    ok: true,
    data: { organization_scope: scope, department_id: normalizedDepartmentId },
  };
}

export function resolveBoardOrganizationTarget({
  requestedScope,
  requestedDepartmentId,
  existingMember = null,
  managedDepartmentId = null,
  routeDepartmentId = null,
  routeOrganizationScope = null,
  isGlobal = false,
} = {}) {
  const managedId = normalizeId(managedDepartmentId);
  const routeId = normalizeId(routeDepartmentId);
  const requestedId = normalizeId(requestedDepartmentId);

  if (routeOrganizationScope === BOARD_ORGANIZATION_SCOPES.CLUB) {
    if (!isGlobal) return { ok: false, message: "Du darfst den Gesamtvereinsvorstand nicht verwalten." };
    if (requestedScope && requestedScope !== BOARD_ORGANIZATION_SCOPES.CLUB) return { ok: false, message: "Der Organisationsbereich darf nicht verlassen werden." };
    if (requestedId) return { ok: false, message: "Der Gesamtvereinsvorstand darf keine Abteilung besitzen." };
    return validateBoardOrganizationPair({ organizationScope: BOARD_ORGANIZATION_SCOPES.CLUB, departmentId: null });
  }

  if (managedId) {
    if ((routeId && routeId !== managedId) || (requestedId && requestedId !== managedId)) {
      return { ok: false, message: "Die Abteilung darf nicht geändert werden." };
    }
    if (requestedScope && requestedScope !== BOARD_ORGANIZATION_SCOPES.DEPARTMENT) {
      return { ok: false, message: "Der Organisationsbereich darf nicht verlassen werden." };
    }
    return validateBoardOrganizationPair({
      organizationScope: BOARD_ORGANIZATION_SCOPES.DEPARTMENT,
      departmentId: managedId,
    });
  }

  if (routeId) {
    if (!isGlobal) {
      return { ok: false, message: "Du darfst diesen Abteilungsbereich nicht verwalten." };
    }
    if (requestedId && requestedId !== routeId) {
      return { ok: false, message: "Die Abteilung darf nicht geändert werden." };
    }
    if (requestedScope && requestedScope !== BOARD_ORGANIZATION_SCOPES.DEPARTMENT) {
      return { ok: false, message: "Der Organisationsbereich darf nicht verlassen werden." };
    }
    return validateBoardOrganizationPair({
      organizationScope: BOARD_ORGANIZATION_SCOPES.DEPARTMENT,
      departmentId: routeId,
    });
  }

  if (!isGlobal) {
    if (!existingMember) {
      return { ok: false, message: "Du darfst keine globale Organisationszuordnung anlegen." };
    }
    const current = validateBoardOrganizationPair({
      organizationScope: existingMember.organization_scope,
      departmentId: existingMember.department_id,
    });
    if (!current.ok) return current;
    if ((requestedScope && requestedScope !== current.data.organization_scope)
      || (requestedId && requestedId !== current.data.department_id)) {
      return { ok: false, message: "Die Organisationszuordnung darf nicht geändert werden." };
    }
    return current;
  }

  return validateBoardOrganizationPair({
    organizationScope: requestedScope || existingMember?.organization_scope || BOARD_ORGANIZATION_SCOPES.UNASSIGNED,
    departmentId: requestedId,
  });
}

export function getBoardOrganizationLabel(member = {}, departmentLabel = null) {
  if (member.organization_scope === BOARD_ORGANIZATION_SCOPES.CLUB) return "Gesamtverein";
  if (member.organization_scope === BOARD_ORGANIZATION_SCOPES.UNASSIGNED) return "Nicht zugeordnet";
  if (member.organization_scope === BOARD_ORGANIZATION_SCOPES.DEPARTMENT) return departmentLabel || "Abteilung";
  return "Ungültige Zuordnung";
}
