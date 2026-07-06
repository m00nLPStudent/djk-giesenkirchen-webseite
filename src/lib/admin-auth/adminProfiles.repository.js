import { supabase } from "@/lib/supabase";

export async function fetchAdminProfiles() {
  return await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}

export async function updateAdminProfileStatus(userId, isActive) {
  return await supabase
    .from("admin_profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
    .select("id, is_active")
    .maybeSingle();
}
