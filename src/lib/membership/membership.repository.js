import { supabase } from "@/lib/supabase";

export async function insertMembershipRequest(payload, client = supabase) {
  return await client
    .from("membership_requests")
    .insert(payload)
    .select("id, first_name, last_name, request_type, year_group, desired_team_id, desired_team_season_id, created_at")
    .single();
}

export async function updateMembershipRequest(id, payload, client = supabase) {
  return await client
    .from("membership_requests")
    .update(payload)
    .eq("id", id)
    .select("*, teams(name_de)")
    .maybeSingle();
}
