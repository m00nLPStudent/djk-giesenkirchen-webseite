"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { deleteTeamType, saveTeamType } from "@/components/admin/settings/team-types/teamTypes.service";

const error = (message) => ({ data: null, error: { message } });

async function hasActiveDepartment(db, departmentId) {
  if (!departmentId) return false;
  const result = await db.from("departments").select("id").eq("id", departmentId).eq("is_active", true).maybeSingle();
  return !result.error && Boolean(result.data);
}

export async function saveTeamTypeAction(form, id = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) return error(auth.message || "Berechtigung fehlt.");
  if (!(await hasActiveDepartment(auth.supabaseServer, form?.department_id))) return error("Bitte eine gültige aktive Abteilung auswählen.");
  const result = await saveTeamType(auth.supabaseServer, form, id);
  if (!result.error) revalidatePath("/admin/settings/team-types");
  return result;
}

export async function deleteTeamTypeAction(id, template) {
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) return error(auth.message || "Berechtigung fehlt.");
  const result = await deleteTeamType(auth.supabaseServer, id, template);
  if (!result.error) revalidatePath("/admin/settings/team-types");
  return result;
}
