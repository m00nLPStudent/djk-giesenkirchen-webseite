import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";
import { toAdminError } from "./adminDiagnostics";
import { resolveAdminProfileForAuthUser } from "./adminProfileLookup";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

export async function fetchAdminProfile(userId, email) {
  const client = getReadClient();
  const result = await resolveAdminProfileForAuthUser(client, {
    id: userId,
    email,
  }, { fields: "*" });

  if (result?.queryError) {
    return {
      data: null,
      error: toAdminError(
        `admin_profiles.by-${result.lookupType || "unknown"}`,
        result.queryError,
      ),
    };
  }

  return {
    data: result?.profile || null,
    error: null,
  };
}

export async function fetchAdminRoles({ onlyActive = true } = {}) {
  const client = getReadClient();

  let query = client
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
  const client = getReadClient();

  let query = client
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
  const client = getReadClient();

  return await client
    .from("admin_user_roles")
    .select("user_id, role_id, is_primary, created_at")
    .eq("user_id", userId);
}

export async function fetchRolesByIds(roleIds = []) {
  if (!roleIds.length) return { data: [], error: null };

  const client = getReadClient();

  return await client
    .from("admin_roles")
    .select("*")
    .in("id", roleIds)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
}

export async function fetchRolePermissionsByRoleIds(roleIds = []) {
  if (!roleIds.length) return { data: [], error: null };

  const client = getReadClient();

  return await client
    .from("admin_role_permissions")
    .select("role_id, permission_id")
    .in("role_id", roleIds);
}

export async function fetchPermissionsByIds(permissionIds = []) {
  if (!permissionIds.length) return { data: [], error: null };

  const client = getReadClient();

  return await client
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
