import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

export async function fetchAdminPermissionByKey(key) {
  return await supabase
    .from("admin_permissions")
    .select("id, key, name")
    .eq("key", key)
    .maybeSingle();
}

export async function createAdminPermission(payload) {
  return await supabase
    .from("admin_permissions")
    .insert(payload)
    .select("*")
    .maybeSingle();
}

export async function updateAdminPermission(permissionId, payload) {
  return await supabase
    .from("admin_permissions")
    .update(payload)
    .eq("id", permissionId)
    .select("*")
    .maybeSingle();
}

export async function fetchAllRolePermissionLinks() {
  const client = getReadClient();

  return await client
    .from("admin_role_permissions")
    .select("role_id, permission_id, created_at")
    .order("created_at", { ascending: true });
}

export async function upsertRolePermissionLink(roleId, permissionId) {
  return await supabase
    .from("admin_role_permissions")
    .upsert(
      { role_id: roleId, permission_id: permissionId },
      { onConflict: "role_id,permission_id" },
    )
    .select("role_id, permission_id")
    .maybeSingle();
}

export async function removeRolePermissionLink(roleId, permissionId) {
  return await supabase
    .from("admin_role_permissions")
    .delete()
    .eq("role_id", roleId)
    .eq("permission_id", permissionId);
}
