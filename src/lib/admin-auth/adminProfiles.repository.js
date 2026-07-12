import { supabase } from "@/lib/supabase";
import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

function getReadClient() {
  if (typeof window === "undefined") return supabase;
  return getSupabaseBrowserClient() || supabase;
}

export async function fetchAdminProfiles(client = getReadClient()) {
  return await client
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function fetchAdminProfileById(
  profileId,
  client = getReadClient(),
) {
  return await client
    .from("admin_profiles")
    .select("id, full_name, email, is_active")
    .eq("id", profileId)
    .maybeSingle();
}

export async function createAdminProfile(payload, client = supabase) {
  return await client
    .from("admin_profiles")
    .insert(payload)
    .select("*")
    .maybeSingle();
}

export async function updateAdminProfileById(
  profileId,
  payload,
  client = supabase,
) {
  return await client
    .from("admin_profiles")
    .update(payload)
    .eq("id", profileId)
    .select("*")
    .maybeSingle();
}

export async function deleteAdminProfileById(profileId, client = supabase) {
  return await client.from("admin_profiles").delete().eq("id", profileId);
}

async function updateProfileStatusBy(
  column,
  userId,
  isActive,
  client = supabase,
) {
  return await client
    .from("admin_profiles")
    .update({ is_active: isActive })
    .eq(column, userId)
    .select("id, is_active")
    .maybeSingle();
}

export async function updateAdminProfileStatus(
  userId,
  isActive,
  client = supabase,
) {
  return await updateProfileStatusBy("id", userId, isActive, client);
}
