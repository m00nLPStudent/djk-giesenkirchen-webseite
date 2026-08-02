"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { CATEGORY_GROUPS, normalizeCategoryPayload } from "@/components/admin/settings/categories/categoryMasterData.core";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

const failure = (message) => ({ data: null, error: { message } });

export async function saveCategoryMasterDataAction(groupKey, value, id = null) {
  const group = CATEGORY_GROUPS[groupKey];
  if (!group) return failure("Unbekannter Stammdatenbereich.");
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) return failure(auth.message || "Berechtigung fehlt.");
  const payload = normalizeCategoryPayload(value);
  if (!payload.name_de || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) return failure("Name und ein normalisierter technischer Schlüssel sind erforderlich.");
  const query = id ? auth.supabaseServer.from(group.table).update(payload).eq("id", id) : auth.supabaseServer.from(group.table).insert(payload);
  const result = await query.select("*").maybeSingle();
  if (!result.error) { revalidatePath("/admin/settings/categories"); if (groupKey === "news") revalidatePublicContent("news"); if (groupKey === "events") revalidatePublicContent("events"); }
  return result.error ? failure("Der Eintrag konnte nicht gespeichert werden.") : result;
}

export async function deleteCategoryMasterDataAction(groupKey, id) {
  const group = CATEGORY_GROUPS[groupKey];
  if (!group) return failure("Unbekannter Stammdatenbereich.");
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) return failure(auth.message || "Berechtigung fehlt.");
  if (groupKey === "events") { const current = await auth.supabaseServer.from(group.table).select("is_system").eq("id", id).maybeSingle(); if (current.data?.is_system) return failure("Systemtypen können nicht gelöscht werden."); }
  const result = await auth.supabaseServer.from(group.table).delete().eq("id", id);
  if (!result.error) { revalidatePath("/admin/settings/categories"); if (groupKey === "news") revalidatePublicContent("news"); if (groupKey === "events") revalidatePublicContent("events"); }
  return result.error ? failure("Der Eintrag konnte nicht gelöscht werden.") : result;
}
