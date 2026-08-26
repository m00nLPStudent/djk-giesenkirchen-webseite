"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { revalidatePublicContent } from "@/lib/revalidation/publicContentRevalidation";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { requiresPublishPermission } from "@/lib/admin-auth/publishPermission.core.mjs";

const fail = (error) => ({ ok: false, error });
const allowedVisibilities = (auth) => canManageMedia(auth.roles) ? ["public", "admin"] : ["public"];
const imagePayload = (input = {}) => ({ alt_text_de: input.alt_text_de || null, alt_text_en: input.alt_text_en || null, caption_de: input.caption_de || null, caption_en: input.caption_en || null, sort_order: Number(input.sort_order || 0), is_active: input.is_active ?? true });
const pagePayload = (input = {}) => ({ title_de: input.title_de || "", title_en: input.title_en || "", teaser_de: input.teaser_de || "", teaser_en: input.teaser_en || "", content_de: input.content_de || "", content_en: input.content_en || "", is_published: input.is_published ?? false, is_active: input.is_active ?? true, published_at: input.published_at || null, sort_order: Number(input.sort_order || 0) });
const milestonePayload = (input = {}) => {
  const year = Number(input.milestone_year || new Date().getFullYear());
  const until = input.milestone_year_until ? Number(input.milestone_year_until) : null;
  const label = until && until !== year ? `${year}-${until}` : String(year);
  return { milestone_year: year, milestone_year_until: until, title_de: input.title_de || label, title_en: input.title_en || label, description_de: input.description_de || "", description_en: input.description_en || "", sort_order: Number(input.sort_order || 0), is_active: input.is_active ?? true };
};

async function authorize(pageId) {
  const auth = await assertAdminActionPermission({ requiredPermission: "club_history.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Chronik-Service ist nicht konfiguriert.");
  if (pageId) {
    const page = await db.from("club_history_pages").select("id").eq("id", pageId).maybeSingle();
    if (page.error || !page.data) return fail("Vereinschronik nicht gefunden.");
  }
  return { ok: true, auth, db };
}

function finish() {
  revalidatePath("/admin/club-history");
  revalidatePublicContent("club-history");
}

export async function saveClubHistoryPageAction(input, pageId = null) {
  const authorization = await authorize(pageId);
  if (!authorization.ok) return authorization;
  const db = authorization.db;
  const payload = pagePayload(input);
  let previous = null;
  if (pageId) {
    const existing = await db.from("club_history_pages").select("id,is_published,published_at").eq("id", pageId).maybeSingle();
    if (existing.error || !existing.data) return fail(existing.error?.message || "Vereinschronik nicht gefunden.");
    previous = existing.data;
  }
  if (requiresPublishPermission(previous, payload, { tracksPublishedAt: true })) {
    const publishPermission = await assertAdminActionPermission({ requiredPermission: "club_history.publish", supabaseServer: authorization.auth.supabaseServer });
    if (!publishPermission.ok) return fail(publishPermission.message || "Berechtigung zum Veröffentlichen fehlt.");
  }
  const saved = pageId
    ? await db.from("club_history_pages").update(payload).eq("id", pageId).select("*").single()
    : await db.from("club_history_pages").insert({ ...payload, page_key: "fussball-vereinsgeschichte" }).select("*").single();
  if (saved.error) return fail(saved.error.message);
  finish();
  return { ok: true, data: saved.data };
}

export async function createClubHistoryMilestoneAction(pageId, input = {}) {
  const authorization = await authorize(pageId);
  if (!authorization.ok) return authorization;
  const db = authorization.db;
  const saved = await db.from("club_history_milestones").insert({ club_history_page_id: pageId, ...milestonePayload(input) }).select("*").single();
  if (saved.error) return fail(saved.error.message);
  finish();
  return { ok: true, data: saved.data };
}

export async function updateClubHistoryMilestoneAction(id, input = {}) {
  const auth = await assertAdminActionPermission({ requiredPermission: "club_history.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Chronik-Service ist nicht konfiguriert.");
  const saved = await db.from("club_history_milestones").update(milestonePayload(input)).eq("id", id).select("*").single();
  if (saved.error) return fail(saved.error.message);
  finish();
  return { ok: true, data: saved.data };
}

export async function deleteClubHistoryMilestoneAction(id) {
  const auth = await assertAdminActionPermission({ requiredPermission: "club_history.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Chronik-Service ist nicht konfiguriert.");
  const removed = await db.from("club_history_milestones").delete().eq("id", id);
  if (removed.error) return fail(removed.error.message);
  finish();
  return { ok: true };
}

export async function loadClubHistoryMediaPickerAction(filters = {}, pageId = null) {
  const authorization = await authorize(pageId);
  if (!authorization.ok) return { ...authorization, items: [], total: 0 };
  const allowed = allowedVisibilities(authorization.auth);
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "club_history");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ...fail("Medien konnten nicht geladen werden."), items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadClubHistoryMediaAction(formData, pageId = null) {
  try {
    const authorization = await authorize(pageId);
    if (!authorization.ok) return authorization;
    const result = await uploadMediaAsset(formData.get("file"), { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "club_history" }, authorization.auth.profile.id);
    if (result.error) return fail(result.stage === "validation" ? result.error.message : "Das Chronikbild konnte nicht hochgeladen werden.");
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "club_history" });
    return resolved.error ? fail("Das hochgeladene Chronikbild konnte nicht geladen werden.") : { ok: true, item: resolved.data };
  } catch {
    return fail("Das Chronikbild konnte nicht hochgeladen werden.");
  }
}

export async function createClubHistoryImageAction(pageId, mediaAssetId, input = {}) {
  const authorization = await authorize(pageId);
  if (!authorization.ok) return authorization;
  const media = await resolveEntityImageMedia(mediaAssetId, { allowedVisibilities: allowedVisibilities(authorization.auth) });
  if (media.error || !media.data) return fail(media.error?.message || "Chronikbild nicht gefunden.");
  const db = authorization.db;
  const saved = await db.from("club_history_images").insert({ club_history_page_id: pageId, image_url: null, image_path: null, media_asset_id: media.data.id, ...imagePayload(input) }).select("*").single();
  if (saved.error) return fail(saved.error.message);
  const usage = await synchronizeMediaAssignment("club_history", saved.data.id, media.data.id, "image");
  if (usage.error) {
    await db.from("club_history_images").delete().eq("id", saved.data.id);
    return fail("Die Chronikbild-Verwendung konnte nicht gespeichert werden.");
  }
  finish();
  return { ok: true, data: { ...saved.data, resolved_image_url: media.data.previewUrl, selectedMedia: media.data } };
}

export async function updateClubHistoryImageAction(id, mediaAssetId, input = {}) {
  const auth = await assertAdminActionPermission({ requiredPermission: "club_history.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Chronik-Service ist nicht konfiguriert.");
  const previous = await db.from("club_history_images").select("*").eq("id", id).maybeSingle();
  if (previous.error || !previous.data) return fail("Chronikbild nicht gefunden.");
  if (!mediaAssetId && !previous.data.media_asset_id) {
    const legacySaved = await db.from("club_history_images").update(imagePayload(input)).eq("id", id).select("*").single();
    if (legacySaved.error) return fail(legacySaved.error.message);
    finish();
    return { ok: true, data: { ...legacySaved.data, resolved_image_url: legacySaved.data.image_url, selectedMedia: null } };
  }
  if (!mediaAssetId) return fail("Zum Entfernen bitte die Bildzuordnung löschen.");
  const media = await resolveEntityImageMedia(mediaAssetId, { allowArchived: previous.data.media_asset_id === mediaAssetId, allowedVisibilities: allowedVisibilities(auth) });
  if (media.error || !media.data) return fail(media.error?.message || "Chronikbild nicht gefunden.");
  const saved = await db.from("club_history_images").update({ media_asset_id: media.data.id, ...imagePayload(input) }).eq("id", id).select("*").single();
  if (saved.error) return fail(saved.error.message);
  const usage = await synchronizeMediaAssignment("club_history", id, media.data.id, "image");
  if (usage.error) {
    await db.from("club_history_images").update(previous.data).eq("id", id);
    return fail("Die Chronikbild-Verwendung konnte nicht gespeichert werden.");
  }
  finish();
  return { ok: true, data: { ...saved.data, resolved_image_url: media.data.previewUrl, selectedMedia: media.data } };
}

export async function deleteClubHistoryImageAction(id) {
  const auth = await assertAdminActionPermission({ requiredPermission: "club_history.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Chronik-Service ist nicht konfiguriert.");
  const existing = await db.from("club_history_images").select("id").eq("id", id).maybeSingle();
  if (existing.error || !existing.data) return fail("Chronikbild nicht gefunden.");
  const removed = await db.from("club_history_images").delete().eq("id", id);
  if (removed.error) return fail(removed.error.message);
  // I1 removes only the relation. Central assets and legacy storage objects remain intact.
  finish();
  return { ok: true };
}
