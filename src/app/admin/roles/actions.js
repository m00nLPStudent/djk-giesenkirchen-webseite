"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminRole,
  fetchAdminRoleByKey,
  updateAdminRole,
  updateAdminRoleStatus,
} from "@/lib/admin-auth/adminRoles.repository";
import {
  buildRolePayload,
  normalizeRoleKey,
  validateRolePayload,
} from "@/components/admin/roles/helpers/roles.payload";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

function isSameRole(existingRole, roleId) {
  if (!existingRole || !roleId) return false;
  return existingRole.id === roleId;
}

export async function saveAdminRoleAction({ roleId, values }) {
  const access = await assertAdminActionPermission({
    requiredPermission: "roles.edit",
  });
  if (!access.ok) {
    return access;
  }

  const payload = buildRolePayload(values);
  const validation = validateRolePayload(payload);

  if (!validation.isValid) {
    return {
      ok: false,
      message: "Bitte Eingaben pruefen.",
      errors: validation.errors,
    };
  }

  const normalizedKey = normalizeRoleKey(payload.key);
  const { data: existingRole } = await fetchAdminRoleByKey(normalizedKey);

  if (existingRole && !isSameRole(existingRole, roleId)) {
    return {
      ok: false,
      message: "Der Rollen-Key ist bereits vergeben.",
      errors: { key: "Key bereits vorhanden." },
    };
  }

  if (roleId) {
    const { error } = await updateAdminRole(roleId, payload);
    if (error) {
      return { ok: false, message: "Rolle konnte nicht aktualisiert werden." };
    }
  } else {
    const { error } = await createAdminRole(payload);
    if (error) {
      return { ok: false, message: "Rolle konnte nicht erstellt werden." };
    }
  }

  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function updateAdminRoleStatusAction({
  roleId,
  roleKey,
  isActive,
}) {
  const access = await assertAdminActionPermission({
    requiredPermission: "roles.edit",
  });
  if (!access.ok) {
    return access;
  }

  if (!roleId) {
    return { ok: false, message: "Ungueltige Rollen-ID." };
  }

  if (roleKey === "superadmin" && !isActive) {
    return {
      ok: false,
      message:
        "Die Rolle superadmin kann in Phase B3 nicht deaktiviert werden.",
    };
  }

  const { error } = await updateAdminRoleStatus(roleId, isActive);
  if (error) {
    return {
      ok: false,
      message: "Rollenstatus konnte nicht aktualisiert werden.",
    };
  }

  revalidatePath("/admin/roles");
  return { ok: true };
}
