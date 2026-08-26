import { supabase } from "@/lib/supabase";

export async function insertMembershipRequest(payload, client = supabase) {
  return await client
    .from("membership_requests")
    .insert(payload)
    .select("id, first_name, last_name, request_type, year_group, desired_team_id, created_at")
    .single();
}

export async function findMembershipTeamById(id, client = supabase) {
  return await client
    .from("teams")
    .select("id, is_active, departments!teams_department_id_fkey(slug, is_active)")
    .eq("id", id)
    .maybeSingle();
}

export async function updateMembershipRequest(id, payload, client = supabase) {
  return await client
    .from("membership_requests")
    .update(payload)
    .eq("id", id)
    .select("*, teams(name_de)")
    .maybeSingle();
}
