import "server-only";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";

export async function loadSettingsEditorRecord(table, id = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.view" });
  if (!auth.ok) return { ok: false, reason: "missing-settings-permission" };
  if (!id) return { ok: true, record: null };
  const result = await auth.supabaseServer.from(table).select("*").eq("id", id).maybeSingle();
  if (result.error || !result.data) return { ok: false, reason: "settings-record-not-found" };
  return { ok: true, record: JSON.parse(JSON.stringify(result.data)) };
}
