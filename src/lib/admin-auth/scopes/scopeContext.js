function normalizeScopeValue(value = "") {
  return String(value || "").trim();
}

export function uniqueScopeValues(values = []) {
  const seen = new Set();
  const normalizedValues = [];

  for (const value of values || []) {
    const normalized = normalizeScopeValue(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    normalizedValues.push(normalized);
  }

  return normalizedValues;
}

export function mergeScopeValues(...lists) {
  return uniqueScopeValues(lists.flat());
}

export function createEmptyScopeContext(overrides = {}) {
  return {
    adminProfileId: null,
    userId: null,
    roleKeys: [],
    permissionKeys: [],
    roleScopeTypes: [],
    regularAssignedTeamIds: [],
    manualAssignedTeamIds: [],
    assignedTeamIds: [],
    coachId: null,
    boardMemberId: null,
    isGlobal: false,
    canAccessYouthAll: false,
    ...overrides,
  };
}
