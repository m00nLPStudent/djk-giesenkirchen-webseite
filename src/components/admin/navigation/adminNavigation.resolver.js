import { findActiveNavigationEntry } from "./adminNavigation.matching.js";
import { canAccessMembershipRequests } from "../../../lib/admin-auth/membershipAccess.js";

function unique(values = []) {
  return new Set((values || []).map((value) => value?.key || value).filter(Boolean));
}

function hasPermission(item, permissionSet) {
  const required = item.permissionKeys?.length
    ? item.permissionKeys
    : item.permissionKey ? [item.permissionKey] : [];
  return required.length === 0 || required.some((key) => permissionSet.has(key));
}

function hasScope(scopeType, context = {}) {
  const types = unique(context.roleScopeTypes);
  const hasTeams = (context.assignedTeamIds || []).length > 0;
  const global = Boolean(context.isGlobal || types.has("global"));
  if (scopeType === "permission_only") return true;
  if (scopeType === "team_access") {
    return global || types.has("department_manager") || context.canAccessYouthAll || types.has("youth_all") || hasTeams || types.has("own_board_card");
  }
  if (scopeType === "staff_access") {
    return hasScope("team_access", context) || types.has("own_staff_card");
  }
  if (scopeType === "board_access") return global || types.has("own_board_card");
  return false;
}

function isRuntimeCandidate(item, includePlanned) {
  if (item.implementationStatus === "active") return Boolean(item.href);
  return includePlanned && item.implementationStatus === "planned";
}

function itemDto(item, activeItemKey, permissionSet) {
  return {
    key: item.key, label: item.label, href: item.href, icon: item.iconKey,
    description: item.description, isActive: item.key === activeItemKey,
    isExact: Boolean(item.exactMatch),
    isReadOnly: item.writePermissionKeys?.length
      ? !item.writePermissionKeys.some((key) => permissionSet.has(key))
      : false,
    status: item.implementationStatus, isExternal: Boolean(item.isExternal),
  };
}

export function resolveAdminNavigation({
  sections = [], permissionKeys = [], roleKeys = [], scopeContext = {}, currentPath = "/admin",
  featureFlags = {},
} = {}) {
  const permissionSet = unique(permissionKeys);
  const includePlanned = featureFlags.includePlanned === true;
  const allowed = sections.map((section) => ({
    ...section,
    items: [...(section.items || [])]
      .sort((a, b) => a.order - b.order)
      .filter((item) => isRuntimeCandidate(item, includePlanned))
      .filter((item) => item.implementationStatus !== "active" || ["membership_requests", "superadmin_only", "media_roles"].includes(item.accessPolicy) || hasPermission(item, permissionSet))
      .filter((item) => item.accessPolicy !== "table_tennis" || scopeContext.isGlobal || ["vorstand", "tischtennis-vorstand", "superadmin"].some((role) => unique(roleKeys).has(role)))
      .filter((item) => item.accessPolicy !== "club_board" || scopeContext.isGlobal || ["superadmin", "vorstand"].some((role) => unique(roleKeys).has(role)))
      .filter((item) => item.accessPolicy !== "football_modules" || !unique(roleKeys).has("tischtennis-vorstand") || unique(roleKeys).has("superadmin"))
      .filter((item) => item.accessPolicy !== "membership_requests" || canAccessMembershipRequests({ roleKeys, permissionKeys, scopeContext }))
      .filter((item) => item.accessPolicy !== "superadmin_only" || unique(roleKeys).has("superadmin"))
      .filter((item) => item.accessPolicy !== "media_roles" || ["superadmin", "webmaster"].some((role) => unique(roleKeys).has(role)))
      .filter((item) => item.implementationStatus !== "active" || hasScope(item.scopeType, scopeContext)),
  })).filter((section) => section.items.length > 0);
  const active = findActiveNavigationEntry(allowed, currentPath);
  const dtoSections = allowed.sort((a, b) => a.order - b.order).map((section) => ({
    key: section.key, label: section.label, icon: section.iconKey,
    href: section.href, description: section.description,
    isActive: section.key === active.sectionKey,
    items: section.items.map((item) => itemDto(item, active.itemKey, permissionSet)),
  }));
  return {
    sections: dtoSections,
    activeSectionKey: active.sectionKey,
    activeItemKey: active.itemKey,
  };
}
