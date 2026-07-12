import { supabase } from "@/lib/supabase";

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    return null;
  }

  return supabase;
}
