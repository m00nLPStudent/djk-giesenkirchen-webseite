"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { archiveMediaAsset, canManageMedia, uploadMediaAsset } from "@/components/admin/media-library/media.service";

async function authorize() {
  const auth = await assertAdminActionPermission({});
  if (!auth.ok || !canManageMedia(auth.roles)) return { ok: false, error: "Nur Superadmins und Webmaster dürfen Medien verwalten." };
  return auth;
}

export async function uploadMediaAction(formData) {
  try {
    const auth = await authorize();
    if (!auth.ok) return { ok: false, error: auth.error };
    const result = await uploadMediaAsset(formData.get("file"), {
      displayName: formData.get("displayName"), altText: formData.get("altText"),
      visibility: formData.get("visibility"), purpose: formData.get("purpose"),
    }, auth.profile.id);
    if (result.error) {
      console.error("[media-upload]", { stage: result.stage, code: result.error.code || "MEDIA_UPLOAD_FAILED", message: result.error.message, rollbackAttempted: Boolean(result.rollbackAttempted), rollbackErrorCode: result.rollbackError?.code || null });
      return { ok: false, error: result.stage === "validation" ? result.error.message : "Das Medium konnte nicht hochgeladen werden." };
    }
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (error) {
    console.error("[media-upload]", { stage: "server_action", code: error?.code || "UNEXPECTED_MEDIA_ACTION_ERROR", message: error?.message || "Unbekannter Fehler" });
    return { ok: false, error: "Das Medium konnte nicht hochgeladen werden." };
  }
}

export async function archiveMediaAction(id) {
  const auth = await authorize();
  if (!auth.ok) return { ok: false, error: auth.error };
  const result = await archiveMediaAsset(id);
  if (result.error) return { ok: false, error: result.error.message };
  revalidatePath("/admin/media");
  return { ok: true };
}
