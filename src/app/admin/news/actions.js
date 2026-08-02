"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { resolveNewsAuthorName, sanitizeNewsWritePayload } from "@/components/admin/news/helpers/newsAuthor.core.mjs";

async function resolveAuthorName(db, profile) {
  const { data } = await db.from("admin_profiles").select("full_name, email").eq("id", profile.id).maybeSingle();
  return resolveNewsAuthorName(data || profile);
}

export async function saveNewsWithAuthorAction(payload, newsId = null) {
  const permissionResult = await assertAdminActionPermission({ requiredPermission: newsId ? "news.edit" : "news.create" });
  if (!permissionResult.ok) return { data: null, error: { message: permissionResult.message || "Berechtigung fehlt." } };

  const db = permissionResult.supabaseServer;
  const safePayload = sanitizeNewsWritePayload(payload);

  if (newsId) {
    const { data: existing, error: existingError } = await db.from("news").select("id, author").eq("id", newsId).maybeSingle();
    if (existingError || !existing) return { data: null, error: existingError || { message: "News nicht gefunden." } };
    return await db.from("news").update({ ...safePayload, author: existing.author }).eq("id", newsId).select("*").single();
  }

  const author = await resolveAuthorName(db, permissionResult.profile);
  return await db.from("news").insert({ ...safePayload, author }).select("*").single();
}
