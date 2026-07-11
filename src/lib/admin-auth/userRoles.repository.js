import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

export async function fetchAllUserRoleLinks() {
  const client = getReadClient();

  return await client
    .from("admin_user_roles")
    .select("user_id, role_id, is_primary, created_at")
    .order("created_at", { ascending: true });
}

export async function fetchUserRoleLinksByUserId(
  userId,
  client = getReadClient(),
) {
  return await client
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

export async function upsertUserRoleLinks(roleLinks = [], client = supabase) {
  if (!roleLinks.length) {
    return { data: [], error: null };
  }

  return await client
    .from("admin_user_roles")
    .upsert(roleLinks, { onConflict: "user_id,role_id" })
    .select("user_id, role_id, is_primary");
}

export async function deleteUserRoleLinksByRoleIds(
  userId,
  roleIds = [],
  client = supabase,
) {
  if (!roleIds.length) {
    return { data: [], error: null };
  }

  return await client
    .from("admin_user_roles")
    .delete()
    .eq("user_id", userId)
    .in("role_id", roleIds);
}
