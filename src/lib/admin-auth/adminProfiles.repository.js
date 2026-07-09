import { supabase } from "@/lib/supabase";

export async function fetchAdminProfiles() {
  return await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
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
