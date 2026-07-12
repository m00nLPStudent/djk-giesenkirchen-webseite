import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  if (typeof window === "undefined") {
    return createClient(supabaseUrl, supabaseKey);
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export const supabase = createSupabaseClient();
