import { supabase } from "@/lib/supabase";

export async function fetchAdminProfile(userId) {
  return await supabase.from("admin_profiles").select("*").eq("id", userId).maybeSingle();
}

export async function fetchAdminRoles({ onlyActive = true } = {}) {
  let query = supabase.from("admin_roles").select("*").order("sort_order", { ascending: true }).order("name", { ascending: true });

  if (onlyActive) {
    query = query.eq("is_active", true);
  }

  return await query;
}

export async function fetchAdminPermissions({ category } = {}) {
  let query = supabase
    .from("admin_permissions")
    .select("*")
    .order("category", { ascending: true })
    .order("key", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  return await query;
}

export async function fetchUserRoleLinks(userId) {
  return await supabase
    .from("admin_user_roles")
    .select("user_id, role_id, is_primary, created_at")
    .eq("user_id", userId);
}

export async function fetchRolesByIds(roleIds = []) {
  if (!roleIds.length) return { data: [], error: null };

  return await supabase
    .from("admin_roles")
    .select("*")
    .in("id", roleIds)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
}

export async function fetchRolePermissionsByRoleIds(roleIds = []) {
  if (!roleIds.length) return { data: [], error: null };

  return await supabase
    .from("admin_role_permissions")
    .select("role_id, permission_id")
    .in("role_id", roleIds);
}

export async function fetchPermissionsByIds(permissionIds = []) {
  if (!permissionIds.length) return { data: [], error: null };

  return await supabase
    .from("admin_permissions")
    .select("*")
    .in("id", permissionIds)
    .order("category", { ascending: true })
    .order("key", { ascending: true });
}
