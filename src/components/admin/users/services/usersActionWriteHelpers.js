import {
  deleteUserRoleLinksByRoleIds,
  fetchUserRoleLinksByUserId,
  upsertUserRoleLinks,
} from "@/lib/admin-auth/userRoles.repository";
import { buildRoleLinksPayload } from "@/components/admin/users/helpers/users.payload";
import {
  formatSupabaseError,
  isLikelyRlsError,
} from "@/lib/admin-auth/adminDiagnostics";

function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

export function withRlsHint(message) {
  if (!isLikelyRlsError(message || "")) return message;
  return `${message} Zum Schreiben fehlen noch die RLS-Write-Policies. Bitte admin-users-rls-write.sql ausfuehren.`;
}

function linksByRoleId(roleLinks = []) {
  return (roleLinks || []).reduce((acc, row) => {
    if (!row?.role_id) return acc;
    acc[row.role_id] = Boolean(row.is_primary);
    return acc;
  }, {});
}

function roleIdsFromLinks(roleLinks = []) {
  return uniqueValues((roleLinks || []).map((row) => row.role_id));
}

function areRoleLinksEqual(existingLinks = [], desiredLinks = []) {
  const existingMap = linksByRoleId(existingLinks);
  const desiredMap = linksByRoleId(desiredLinks);
  const allRoleIds = uniqueValues([
    ...Object.keys(existingMap),
    ...Object.keys(desiredMap),
  ]);

  return allRoleIds.every((roleId) => {
    const existsInCurrent = Object.prototype.hasOwnProperty.call(
      existingMap,
      roleId,
    );
    const existsInDesired = Object.prototype.hasOwnProperty.call(
      desiredMap,
      roleId,
    );

    if (existsInCurrent !== existsInDesired) return false;
    return Boolean(existingMap[roleId]) === Boolean(desiredMap[roleId]);
  });
}

async function getSuperadminRoleId(supabaseServer) {
  const { data, error } = await supabaseServer
    .from("admin_roles")
    .select("id")
    .eq("key", "superadmin")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: formatSupabaseError(
        error,
        "Superadmin-Rolle konnte nicht geladen werden.",
      ),
    };
  }

  return { ok: true, roleId: data?.id || null };
}

async function enforceSelfSuperadminProtection({
  userId,
  currentUserId,
  existingLinks,
  desiredLinks,
  supabaseServer,
}) {
  if (!userId || !currentUserId || userId !== currentUserId) {
    return { ok: true };
  }

  const superadminRole = await getSuperadminRoleId(supabaseServer);
  if (!superadminRole.ok) {
    return {
      ok: false,
      reason: "actor-check-failed",
      message: superadminRole.message,
    };
  }

  if (!superadminRole.roleId) {
    return { ok: true };
  }

  const existingRoleIds = roleIdsFromLinks(existingLinks);
  const currentlySuperadmin = existingRoleIds.includes(superadminRole.roleId);
  if (!currentlySuperadmin) {
    return { ok: true };
  }

  const desiredMap = linksByRoleId(desiredLinks);
  const hasSuperadmin = superadminRole.roleId in desiredMap;
  const superadminIsPrimary = Boolean(desiredMap[superadminRole.roleId]);

  if (!hasSuperadmin || !superadminIsPrimary) {
    return {
      ok: false,
      reason: "self-superadmin-protected",
      message:
        "Eigene Superadmin-Rolle kann hier nicht entfernt oder als primaere Rolle abgesetzt werden.",
      errors: {
        primary_role_id:
          "Beim eigenen Superadmin-Benutzer muss Superadmin primaere Rolle bleiben.",
      },
    };
  }

  return { ok: true };
}

export async function getActorContext(supabaseServer) {
  const {
    data: { user },
    error: userError,
  } = await supabaseServer.auth.getUser();

  if (userError || !user?.id) {
    return {
      ok: false,
      reason: "no-session",
      message:
        "Keine Session in der Server Action. Bitte erneut anmelden und Vorgang wiederholen.",
    };
  }

  const { data: userRoleLinks, error: roleLinksError } = await supabaseServer
    .from("admin_user_roles")
    .select("role_id")
    .eq("user_id", user.id);

  if (roleLinksError) {
    return {
      ok: false,
      reason: "actor-check-failed",
      message: formatSupabaseError(
        roleLinksError,
        "Superadmin-Pruefung fehlgeschlagen.",
      ),
    };
  }

  const roleIds = uniqueValues(
    (userRoleLinks || []).map((link) => link.role_id),
  );

  if (!roleIds.length) {
    return {
      ok: false,
      reason: "not-superadmin",
      message: "Aktueller Benutzer ist nicht als Superadmin berechtigt.",
    };
  }

  const { data: roles, error: rolesError } = await supabaseServer
    .from("admin_roles")
    .select("id, key")
    .in("id", roleIds);

  if (rolesError) {
    return {
      ok: false,
      reason: "actor-check-failed",
      message: formatSupabaseError(
        rolesError,
        "Superadmin-Pruefung fehlgeschlagen.",
      ),
    };
  }

  const isSuperAdmin = (roles || []).some((role) => role?.key === "superadmin");
  if (!isSuperAdmin) {
    return {
      ok: false,
      reason: "not-superadmin",
      message: "Aktueller Benutzer ist nicht als Superadmin berechtigt.",
    };
  }

  return {
    ok: true,
    user,
  };
}

export async function replaceUserRoleLinks(userId, payload, supabaseServer) {
  const { data: existingLinks, error: existingError } =
    await fetchUserRoleLinksByUserId(userId, supabaseServer);

  if (existingError) {
    return {
      ok: false,
      reason: isLikelyRlsError(existingError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          existingError,
          "Aktuelle Rollen konnten nicht geladen werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(existingError.message || ""),
    };
  }

  const desiredLinks = buildRoleLinksPayload(userId, payload);
  const hasRoleChanges = !areRoleLinksEqual(existingLinks || [], desiredLinks);
  if (!hasRoleChanges) {
    return { ok: true, changed: false, needsRlsWritePolicy: false };
  }

  const { error: upsertError } = await upsertUserRoleLinks(
    desiredLinks,
    supabaseServer,
  );
  if (upsertError) {
    return {
      ok: false,
      reason: isLikelyRlsError(upsertError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          upsertError,
          "Rollen konnten nicht gespeichert werden.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(upsertError.message || ""),
    };
  }

  const existingRoleIds = roleIdsFromLinks(existingLinks || []);
  const desiredRoleIds = roleIdsFromLinks(desiredLinks);
  const roleIdsToDelete = existingRoleIds.filter(
    (roleId) => !desiredRoleIds.includes(roleId),
  );

  const { error: deleteRemovedError } = await deleteUserRoleLinksByRoleIds(
    userId,
    roleIdsToDelete,
    supabaseServer,
  );
  if (deleteRemovedError) {
    return {
      ok: false,
      reason: isLikelyRlsError(deleteRemovedError.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(
          deleteRemovedError,
          "Rollen konnten nicht vollstaendig aktualisiert werden. Bestehende Rollen wurden nicht geloescht, bevor neue Rollen gespeichert waren.",
        ),
      ),
      needsRlsWritePolicy: isLikelyRlsError(deleteRemovedError.message || ""),
    };
  }

  return {
    ok: true,
    changed: true,
    needsRlsWritePolicy: false,
  };
}

export async function validateSelfSuperadminRoleChange({
  userId,
  currentUserId,
  payload,
  supabaseServer,
}) {
  const { data: existingLinks, error } = await fetchUserRoleLinksByUserId(
    userId,
    supabaseServer,
  );

  if (error) {
    return {
      ok: false,
      reason: isLikelyRlsError(error.message || "")
        ? "rls-blocked"
        : "write-failed",
      message: withRlsHint(
        formatSupabaseError(error, "Aktuelle Rollen konnten nicht geladen werden."),
      ),
    };
  }

  const desiredLinks = buildRoleLinksPayload(userId, payload);
  return await enforceSelfSuperadminProtection({
    userId,
    currentUserId,
    existingLinks: existingLinks || [],
    desiredLinks,
    supabaseServer,
  });
}
