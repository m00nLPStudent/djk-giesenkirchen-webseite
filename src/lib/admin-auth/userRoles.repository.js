import { supabase } from "@/lib/supabase";

export async function fetchAllUserRoleLinks() {
  return await supabase
    .from("admin_user_roles")
    .select("user_id, role_id, is_primary, created_at")
    .order("created_at", { ascending: true });
}

export async function fetchUserRoleLinksByUserId(userId) {
  return await supabase
    .from("admin_user_roles")
    .select("user_id, role_id, is_primary, created_at")
    .eq("user_id", userId);
}

export async function deleteUserRoleLinksByUserId(userId, client = supabase) {
  return await client.from("admin_user_roles").delete().eq("user_id", userId);
}

export async function insertUserRoleLinks(roleLinks = [], client = supabase) {
  if (!roleLinks.length) {
    return { data: [], error: null };
  }

  return await client
    .from("admin_user_roles")
    .insert(roleLinks)
    .select("user_id, role_id, is_primary");
}
