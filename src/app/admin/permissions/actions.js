"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminPermission,
  fetchAdminPermissionByKey,
  removeRolePermissionLink,
  updateAdminPermission,
  upsertRolePermissionLink,
} from "@/lib/admin-auth/adminPermissions.repository";
import {
  buildPermissionPayload,
  normalizePermissionKey,
  validatePermissionPayload,
} from "@/components/admin/permissions/helpers/permissions.payload";

function isSamePermission(existing, permissionId) {
  if (!existing || !permissionId) return false;
  return existing.id === permissionId;
}

export async function saveAdminPermissionAction({ permissionId, values }) {
  const payload = buildPermissionPayload(values);
  const validation = validatePermissionPayload(payload);

  if (!validation.isValid) {
    return {
      ok: false,
      message: "Bitte Eingaben pruefen.",
      errors: validation.errors,
    };
  }

  const normalizedKey = normalizePermissionKey(payload.key);
  const { data: existing } = await fetchAdminPermissionByKey(normalizedKey);

  if (existing && !isSamePermission(existing, permissionId)) {
    return {
      ok: false,
      message: "Der Permission-Key ist bereits vergeben.",
      errors: { key: "Key bereits vorhanden." },
    };
  }

  if (permissionId) {
    const { error } = await updateAdminPermission(permissionId, payload);
    if (error) {
      return {
        ok: false,
        message: "Permission konnte nicht aktualisiert werden.",
      };
    }
  } else {
    const { error } = await createAdminPermission(payload);
    if (error) {
      return { ok: false, message: "Permission konnte nicht erstellt werden." };
    }
  }

  revalidatePath("/admin/permissions");
  revalidatePath("/admin/permissions/matrix");
  return { ok: true };
}

export async function toggleRolePermissionAction({
  roleId,
  permissionId,
  checked,
}) {
  if (!roleId || !permissionId) {
    return { ok: false, message: "Ungueltige Zuordnung." };
  }

  if (checked) {
    const { error } = await upsertRolePermissionLink(roleId, permissionId);
    if (error)
      return { ok: false, message: "Zuordnung konnte nicht gesetzt werden." };
  } else {
    const { error } = await removeRolePermissionLink(roleId, permissionId);
    if (error)
      return { ok: false, message: "Zuordnung konnte nicht entfernt werden." };
  }

  revalidatePath("/admin/permissions");
  revalidatePath("/admin/permissions/matrix");
  return { ok: true };
}
