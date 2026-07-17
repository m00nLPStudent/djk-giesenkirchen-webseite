"use server";

import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";

export async function revalidatePublicContentAction(scope) {
  console.info("[DeleteTrace] revalidatePublicContentAction:start", { scope });
  try {
    const touched = revalidatePublicContent(scope);
    console.info("[DeleteTrace] revalidatePublicContentAction:success", {
      scope,
      touched,
    });
    return { ok: true, scope, touched };
  } catch (error) {
    console.error("[DeleteTrace] revalidatePublicContentAction:error", {
      scope,
      message: error?.message || null,
    });
    return {
      ok: false,
      scope,
      error: error?.message || "Revalidation failed.",
    };
  }
}
