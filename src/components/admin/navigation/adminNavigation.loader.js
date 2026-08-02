import "server-only";

import { cache } from "react";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { loadAdminProfileScopeContext } from "@/lib/admin-auth/scopes";
import { ADMIN_NAVIGATION_SECTIONS } from "./adminNavigation.config";
import { resolveAdminNavigation } from "./adminNavigation.resolver";

function roleKeys(authContext) {
  return (authContext?.roles || []).map((role) => role?.key).filter(Boolean);
}

function permissionKeys(authContext) {
  return (authContext?.permissions || []).map((permission) => permission?.key || permission).filter(Boolean);
}

export async function loadAdminNavigationFromAuthContext(authContext, currentPath, featureFlags = {}) {
  if (!authContext?.ok) {
    return { sections: [], activeSectionKey: null, activeItemKey: null };
  }
  const scopeResult = await loadAdminProfileScopeContext({
    adminProfileId: authContext.profile?.id || null,
    userId: authContext.userId || null,
    roleKeys: roleKeys(authContext),
    permissionKeys: permissionKeys(authContext),
    supabase: authContext.supabaseServer,
  });
  return resolveAdminNavigation({
    sections: ADMIN_NAVIGATION_SECTIONS,
    permissionKeys: permissionKeys(authContext),
    roleKeys: roleKeys(authContext),
    scopeContext: scopeResult.context,
    currentPath,
    featureFlags,
  });
}

const loadRequestNavigation = cache(async (currentPath, includePlanned) => {
  const authContext = await assertAdminActionPermission({ requiredPermission: "dashboard.view" });
  return loadAdminNavigationFromAuthContext(authContext, currentPath, { includePlanned });
});

export async function loadAdminNavigation(currentPath = "/admin", featureFlags = {}) {
  return loadRequestNavigation(currentPath, featureFlags.includePlanned === true);
}
