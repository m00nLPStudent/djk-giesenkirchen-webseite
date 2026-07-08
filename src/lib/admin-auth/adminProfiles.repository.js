import { supabase } from "@/lib/supabase";

export async function fetchAdminProfiles() {
  return await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

async function updateProfileStatusBy(column, userId, isActive) {
  return await supabase
    .from("admin_profiles")
    .update({ is_active: isActive })
    .eq(column, userId)
    .select("id, is_active")
    .maybeSingle();
}

export async function updateAdminProfileStatus(userId, isActive) {
  return await updateProfileStatusBy("id", userId, isActive);
}
