"use server";

import { createServerActionSupabaseClient } from "@/lib/supabase.server";

export async function adminLogoutAction() {
  const supabaseServer = await createServerActionSupabaseClient();
  const { error } = await supabaseServer.auth.signOut();

  if (error) {
    return {
      ok: false,
      message: error.message || "Logout fehlgeschlagen.",
    };
  }

  return { ok: true };
}
