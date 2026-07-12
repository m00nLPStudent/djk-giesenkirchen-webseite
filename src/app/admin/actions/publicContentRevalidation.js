"use server";

import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

export async function revalidatePublicContentAction(scope) {
  try {
    const touched = revalidatePublicContent(scope);
    return { ok: true, scope, touched };
  } catch (error) {
    return {
      ok: false,
      scope,
      error: error?.message || "Revalidation failed.",
    };
  }
}
