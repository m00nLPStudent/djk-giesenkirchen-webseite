const keys = (values = []) => new Set((values || []).map((value) => value?.key || value).filter(Boolean));

export function canAccessMembershipRequests({ roleKeys = [], permissionKeys = [], scopeContext = {} } = {}) {
  const roles = keys(roleKeys.length ? roleKeys : scopeContext.roleKeys);
  const permissions = keys(permissionKeys.length ? permissionKeys : scopeContext.permissionKeys);
  const isSuperadmin = Boolean(scopeContext.isGlobal || roles.has("superadmin"));
  const isBoard = roles.has("vorstand") && permissions.has("membership_requests.view");
  const isYouth = Boolean(scopeContext.canAccessYouthAll || roles.has("jugendleiter") || roles.has("jugendkoordinator"));
  return isSuperadmin || isBoard || isYouth;
}

export async function loadMembershipRequestsWhenAllowed({ context, load }) {
  if (!canAccessMembershipRequests(context)) return { allowed: false, data: null };
  return { allowed: true, data: await load() };
}
