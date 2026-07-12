import { supabase } from "@/lib/supabase";
import { uploadMediaFile, deleteMediaFile } from "@/lib/storage";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";

export const SPONSOR_PLACEHOLDER_IMAGE = "";

export async function uploadSponsorImage(file, sponsor = {}) {
  return await uploadMediaFile(file, {
    folder: "sponsors",
    name: `${sponsor.name || "sponsor"}-${sponsor.id || Date.now()}`,
    previousUrl: sponsor.image_url,
    ignoredUrls: [SPONSOR_PLACEHOLDER_IMAGE],
  });
}

export async function deleteSponsorImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [SPONSOR_PLACEHOLDER_IMAGE],
  });
}

export async function saveSponsor(sponsor, id = null) {
  const payload = {
    category_id: sponsor.category_id || null,
    name: sponsor.name || null,
    description_de: sponsor.description_de || null,
    description_en: sponsor.description_en || null,
    image_url: sponsor.image_url || null,
    website_url: sponsor.website_url || null,
    facebook_url: sponsor.facebook_url || null,
    instagram_url: sponsor.instagram_url || null,
    tiktok_url: sponsor.tiktok_url || null,
    is_active: sponsor.is_active ?? true,
    sort_order: Number(sponsor.sort_order || 0),
  };

  if (id) {
    const result = await supabase
      .from("sponsors")
      .update(payload)
      .eq("id", id)
      .select("*");

    logAdminSaveEvent({
      module: "sponsors",
      mode: "edit",
      step: "service.saveSponsor",
      operation: "update",
      success: !result.error,
      error: result.error,
      data: result.data,
    });

    return result;
  }

  const result = await supabase.from("sponsors").insert(payload).select("*");

  logAdminSaveEvent({
    module: "sponsors",
    mode: "create",
    step: "service.saveSponsor",
    operation: "insert",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}
