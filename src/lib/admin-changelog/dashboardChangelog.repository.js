import { getSupabaseBrowserClient } from "@/lib/supabase.browser";

export async function acknowledgeDashboardChangelogVersion(version) {
  const db = getSupabaseBrowserClient();

  if (!db) {
    return { data: null, error: new Error("Browser client unavailable") };
  }

  return db.rpc("acknowledge_own_dashboard_changelog", {
    p_version: version,
  });
}
