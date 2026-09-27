export const TRAINER_EDITABLE_TEAM_TABS = new Set([
  "description",
  "training",
  "players",
  "contact",
]);

const ELEVATED_TEAM_ROLE_KEYS = new Set([
  "superadmin",
  "webmaster",
  "vorstand",
  "fussball-vorstand",
]);

export function getActiveRoleKeys(roles = []) {
  return (roles || [])
    .filter((role) => role?.is_active !== false)
    .map((role) => role?.key)
    .filter(Boolean);
}

export function isRestrictedTrainerRoleSet(roles = []) {
  const roleKeys = getActiveRoleKeys(roles);
  return (
    roleKeys.includes("trainer") &&
    !roleKeys.some((roleKey) => ELEVATED_TEAM_ROLE_KEYS.has(roleKey))
  );
}

export function canRestrictedTrainerEditTab(tab) {
  return TRAINER_EDITABLE_TEAM_TABS.has(tab);
}

export function pickTrainerTeamMutationPayload(operation, input = {}) {
  if (operation === "description") {
    return { description_de: String(input.description_de || "").trim() || null };
  }
  if (operation === "training") {
    return { training_times_de: String(input.training_times_de || "").trim() || null };
  }
  if (operation === "contact") {
    return {
      contact_name: String(input.contact_name || "").trim() || null,
      contact_email: String(input.contact_email || "").trim() || null,
      contact_phone: String(input.contact_phone || "").replace(/\s|\+/g, "") || null,
    };
  }
  return null;
}
