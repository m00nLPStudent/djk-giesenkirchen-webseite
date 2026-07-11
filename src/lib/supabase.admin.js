import "server-only";

import { createClient } from "@supabase/supabase-js";

function readAdminEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export function getSupabaseAdminEnvStatus() {
  const env = readAdminEnv();
  return {
    hasUrl: Boolean(env.url),
    hasAnonKey: Boolean(env.anonKey),
    hasServiceRoleKey: Boolean(env.serviceRoleKey),
  };
}

export function createSupabaseAdminClient() {
  const env = readAdminEnv();
  if (!env.url || !env.serviceRoleKey) {
    return null;
  }

  return createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
