import { supabase } from "@/lib/supabase";
import { toAdminError } from "./adminDiagnostics";

export async function fetchAdminProfile(userId, email) {
  const byId = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (byId?.error) {
    return {
      data: null,
      error: toAdminError("admin_profiles.by-id", byId.error),
    };
  }

  if (byId?.data) {
    return byId;
  }

  if (!email) {
    return byId;
  }

  const byEmail = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (byEmail?.error) {
    return {
      data: null,
      error: toAdminError("admin_profiles.by-email", byEmail.error),
    };
  }

  return byEmail;
}

export async function fetchAdminRoles({ onlyActive = true } = {}) {
  let query = supabase
    .from("admin_roles")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

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

export async function fetchAdminRoleByKey(key) {
  return await supabase
    .from("admin_roles")
    .select("id, key, name")
    .eq("key", key)
    .maybeSingle();
}

export async function createAdminRole(payload) {
  return await supabase
    .from("admin_roles")
    .insert(payload)
    .select("*")
    .maybeSingle();
}

export async function updateAdminRole(roleId, payload) {
  return await supabase
    .from("admin_roles")
    .update(payload)
    .eq("id", roleId)
    .select("*")
    .maybeSingle();
}

export async function updateAdminRoleStatus(roleId, isActive) {
  return await supabase
    .from("admin_roles")
    .update({ is_active: isActive })
    .eq("id", roleId)
    .select("id, key, is_active")
    .maybeSingle();
}
