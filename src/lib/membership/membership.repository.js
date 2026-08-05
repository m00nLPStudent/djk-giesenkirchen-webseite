import { supabase } from "@/lib/supabase";

export async function insertMembershipRequest(payload, client = supabase) {
  return await client.from("membership_requests").insert(payload);
}

export async function updateMembershipRequest(id, payload, client = supabase) {
  return await client
    .from("membership_requests")
    .update(payload)
    .eq("id", id)
    .select("*, teams(name_de)")
    .maybeSingle();
}
