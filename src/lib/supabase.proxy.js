import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export function createSupabaseProxyClient(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  let response = NextResponse.next({
    request,
  });
  let cookiesSynced = false;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        if (!Array.isArray(cookiesToSet) || !cookiesToSet.length) {
          return;
        }

        cookiesSynced = true;

        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse() {
      return response;
    },
    didSyncCookies() {
      return cookiesSynced;
    },
  };
}
