import { supabase } from "@/lib/supabase";

export async function insertMembershipRequest(payload) {
  return await supabase.from("membership_requests").insert(payload);
}

export async function updateMembershipRequest(id, payload) {
  return await supabase
    .from("membership_requests")
    .update(payload)
    .eq("id", id)
    .select("*, teams(name_de)")
    .maybeSingle();
}
