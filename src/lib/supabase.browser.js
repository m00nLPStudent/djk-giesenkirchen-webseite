import { createBrowserClient } from "@supabase/ssr";

let browserClient = null;

export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  browserClient = createBrowserClient(url, anonKey);
  return browserClient;
}
