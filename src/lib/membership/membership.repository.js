import { supabase } from "@/lib/supabase";

export async function insertMembershipRequest(payload, client = supabase) {
  return await client
    .from("membership_requests")
    .insert(payload)
    .select("id, first_name, last_name, email, request_type, mail_sent_at, created_at")
    .single();
}

export function markMembershipRequestMailSent(id, sentAt, client = supabase) {
  return client.from("membership_requests").update({ mail_sent_at: sentAt }).eq("id", id).is("mail_sent_at", null).select("id, mail_sent_at").maybeSingle();
}

export async function updateMembershipRequest(id, payload, client = supabase) {
  return await client
    .from("membership_requests")
    .update(payload)
    .eq("id", id)
    .select("*, teams(name_de)")
    .maybeSingle();
}
