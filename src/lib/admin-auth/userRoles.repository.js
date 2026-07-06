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
