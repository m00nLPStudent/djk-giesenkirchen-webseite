"use server";

import { cookies } from "next/headers";
import {
  expireSupabaseAuthCookies,
  getSupabaseAuthCookieNames,
  isInvalidRefreshTokenError,
} from "@/lib/supabase.auth";
import { createServerActionSupabaseClient } from "@/lib/supabase.server";

async function clearServerAuthCookies() {
  const cookieStore = await cookies();
  const cookieNames = getSupabaseAuthCookieNames(
    cookieStore.getAll(),
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );

  expireSupabaseAuthCookies(cookieNames, (name, value, options) => {
    cookieStore.set(name, value, options);
  });
}

export async function adminLogoutAction() {
  const supabaseServer = await createServerActionSupabaseClient();
  const { error } = await supabaseServer.auth.signOut();

  if (!error) {
    await clearServerAuthCookies();
    return { ok: true };
  }

  if (isInvalidRefreshTokenError(error)) {
    await clearServerAuthCookies();
    return {
      ok: true,
      reason: "session-expired",
    };
  }

  await clearServerAuthCookies();

  return {
    ok: false,
    message: error.message || "Logout fehlgeschlagen.",
  };
}
