import { getAllowedMembershipRequestTypes } from "../membership/membershipResponsibility.core.mjs";

export function canAccessMembershipRequests({ roleKeys = [], permissionKeys = [], scopeContext = {} } = {}) {
  const roles = roleKeys.length ? roleKeys : scopeContext.roleKeys || [];
  const permissions = permissionKeys.length ? permissionKeys : scopeContext.permissionKeys || [];
  return getAllowedMembershipRequestTypes({ roleKeys: scopeContext.isGlobal ? [...roles, "superadmin"] : roles, permissionKeys: permissions, action: "view" }).length > 0;
}

export async function loadMembershipRequestsWhenAllowed({ context, load }) {
  if (!canAccessMembershipRequests(context)) return { allowed: false, data: null };
  return { allowed: true, data: await load() };
}
