import { supabase } from "@/lib/supabase";
import {
  deleteMediaFile,
  getStoragePathFromPublicUrl,
  uploadMediaFile,
} from "@/lib/storage";

export const CLUB_HISTORY_PAGE_KEY = "fussball-vereinsgeschichte";

function normalizePagePayload(payload = {}) {
  return {
    title_de: payload.title_de || "",
    title_en: payload.title_en || "",
    teaser_de: payload.teaser_de || "",
    teaser_en: payload.teaser_en || "",
    content_de: payload.content_de || "",
    content_en: payload.content_en || "",
    is_published: payload.is_published ?? false,
    is_active: payload.is_active ?? true,
    published_at: payload.published_at || null,
    sort_order: Number(payload.sort_order || 0),
  };
}

function normalizeImagePayload(payload = {}) {
  return {
    alt_text_de: payload.alt_text_de || null,
    alt_text_en: payload.alt_text_en || null,
    caption_de: payload.caption_de || null,
    caption_en: payload.caption_en || null,
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active ?? true,
  };
}

function normalizeMilestonePayload(payload = {}) {
  const milestoneYear = Number(
    payload.milestone_year || new Date().getFullYear(),
  );
  const milestoneYearUntil = payload.milestone_year_until
    ? Number(payload.milestone_year_until)
    : null;
  const displayYear =
    milestoneYearUntil && milestoneYearUntil !== milestoneYear
      ? `${milestoneYear}-${milestoneYearUntil}`
      : String(milestoneYear);
  const fallbackTitle = String(milestoneYear);

  return {
    milestone_year: milestoneYear,
    milestone_year_until: milestoneYearUntil,
    title_de: payload.title_de || displayYear || fallbackTitle,
    title_en: payload.title_en || displayYear || fallbackTitle,
    description_de: payload.description_de || "",
    description_en: payload.description_en || "",
    sort_order: Number(payload.sort_order || 0),
    is_active: payload.is_active ?? true,
  };
}

export async function upsertClubHistoryPage(payload, pageId = null) {
  const normalized = normalizePagePayload(payload);

  if (pageId) {
    return await supabase
      .from("club_history_pages")
      .update(normalized)
      .eq("id", pageId)
      .select("*")
      .single();
  }

  return await supabase
    .from("club_history_pages")
    .insert({
      ...normalized,
      page_key: CLUB_HISTORY_PAGE_KEY,
    })
    .select("*")
    .single();
}

export async function getClubHistoryImages(pageId) {
  if (!pageId) return { data: [], error: null };

  return await supabase
    .from("club_history_images")
    .select("*")
    .eq("club_history_page_id", pageId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function createClubHistoryImage(pageId, file, payload = {}) {
  if (!pageId || !file) return { data: null, error: null };

  const { data: imageUrl, error: uploadError } = await uploadMediaFile(file, {
    folder: "club-history",
    name: `club-history-${Date.now()}`,
  });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const path = getStoragePathFromPublicUrl(imageUrl);

  return await supabase
    .from("club_history_images")
    .insert({
      club_history_page_id: pageId,
      image_url: imageUrl,
      image_path: path,
      ...normalizeImagePayload(payload),
    })
    .select("*")
    .single();
}

export async function updateClubHistoryImage(id, payload = {}) {
  if (!id) return { data: null, error: null };

  return await supabase
    .from("club_history_images")
    .update(normalizeImagePayload(payload))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteClubHistoryImage(imageItem) {
  if (!imageItem?.id) return { data: null, error: null };

  if (imageItem.image_url) {
    const { error: deleteFileError } = await deleteMediaFile(
      imageItem.image_url,
    );
    if (deleteFileError) {
      return { data: null, error: deleteFileError };
    }
  }

  return await supabase
    .from("club_history_images")
    .delete()
    .eq("id", imageItem.id);
}

export async function getClubHistoryMilestones(pageId) {
  if (!pageId) return { data: [], error: null };

  return await supabase
    .from("club_history_milestones")
    .select("*")
    .eq("club_history_page_id", pageId)
    .order("milestone_year", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function createClubHistoryMilestone(pageId, payload = {}) {
  if (!pageId) return { data: null, error: null };

  return await supabase
    .from("club_history_milestones")
    .insert({
      club_history_page_id: pageId,
      ...normalizeMilestonePayload(payload),
    })
    .select("*")
    .single();
}

export async function updateClubHistoryMilestone(id, payload = {}) {
  if (!id) return { data: null, error: null };

  return await supabase
    .from("club_history_milestones")
    .update(normalizeMilestonePayload(payload))
    .eq("id", id)
    .select("*")
    .single();
}

export async function deleteClubHistoryMilestone(id) {
  if (!id) return { data: null, error: null };

  return await supabase.from("club_history_milestones").delete().eq("id", id);
}
