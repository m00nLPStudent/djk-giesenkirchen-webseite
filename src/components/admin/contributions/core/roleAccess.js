const READ_ONLY_ROLE_PERMISSIONS = {
  superadmin: ["view", "create", "edit", "record_payment", "cancel_payment", "defer", "exempt", "cancel", "export"],
  kassierer: ["view", "create", "edit", "record_payment", "cancel_payment", "defer", "exempt", "cancel", "export"],
  vorstand: ["view", "export"],
  jugendleiter: [],
  trainer: [],
  betreuer: [],
  gast: [],
};

export function getContributionPermissionsForRole(roleKey = "") {
  const suffixes = READ_ONLY_ROLE_PERMISSIONS[roleKey] || [];
  return suffixes.map((suffix) => `contributions.${suffix}`);
}

export function roleHasContributionPermission(roleKey = "", permissionKey = "") {
  return getContributionPermissionsForRole(roleKey).includes(permissionKey);
}
