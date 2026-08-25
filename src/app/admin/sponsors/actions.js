"use server";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import { revalidatePublicContentAction } from "@/app/admin/actions/publicContentRevalidation";

const actionError = (message) => ({ data: null, error: { message } });

async function authorizeSponsor(sponsorId = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: sponsorId ? "sponsors.edit" : "sponsors.create" });
  if (!auth.ok) return { ok: false, message: auth.message || "Berechtigung fehlt." };
  if (sponsorId) {
    const existing = await auth.supabaseServer.from("sponsors").select("id").eq("id", sponsorId).maybeSingle();
    if (existing.error || !existing.data) return { ok: false, message: "Sponsor nicht gefunden." };
  }
  return { ok: true, auth };
}

export async function loadSponsorMediaPickerAction(filters = {}, sponsorId = null) {
  const authorization = await authorizeSponsor(sponsorId);
  if (!authorization.ok) return { ok: false, error: authorization.message, items: [], total: 0 };
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "sponsor");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadSponsorMediaAction(formData, sponsorId = null) {
  try {
    const authorization = await authorizeSponsor(sponsorId);
    if (!authorization.ok) return { ok: false, error: authorization.message };
    const file = formData.get("file");
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Für Sponsorlogos sind nur JPEG, PNG und WebP erlaubt." };
    const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "sponsor" }, authorization.auth.profile.id);
    if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Das Sponsorlogo konnte nicht hochgeladen werden." };
    const resolved = await resolveEntityImageMedia(result.data.id, { purpose: "sponsor" });
    return resolved.error ? { ok: false, error: "Das hochgeladene Sponsorlogo konnte nicht geladen werden." } : { ok: true, item: resolved.data };
  } catch {
    return { ok: false, error: "Das Sponsorlogo konnte nicht hochgeladen werden." };
  }
}

export async function saveSponsorAction(sponsor, sponsorId = null) {
  const authorization = await authorizeSponsor(sponsorId);
  if (!authorization.ok) return actionError(authorization.message);
  const db = createSupabaseAdminClient();
  if (!db) return actionError("Sponsor-Service ist nicht konfiguriert.");
  const previous = sponsorId ? await db.from("sponsors").select("*").eq("id", sponsorId).maybeSingle() : { data: null, error: null };
  if (previous.error || (sponsorId && !previous.data)) return actionError("Sponsor nicht gefunden.");
  const allowed = canManageMedia(authorization.auth.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityImageMedia(sponsor?.image_media_asset_id || null, { allowArchived: Boolean(previous.data?.image_media_asset_id === sponsor?.image_media_asset_id), allowedVisibilities: allowed });
  if (media.error) return actionError(media.error.message);
  const payload = {
    category_id: sponsor?.category_id || null,
    name: sponsor?.name || null,
    description_de: sponsor?.description_de || null,
    description_en: sponsor?.description_en || null,
    image_url: sponsor?.remove_legacy_logo === true ? null : sponsor?.image_url || null,
    image_media_asset_id: media.data?.id || null,
    website_url: sponsor?.website_url || null,
    facebook_url: sponsor?.facebook_url || null,
    instagram_url: sponsor?.instagram_url || null,
    tiktok_url: sponsor?.tiktok_url || null,
    is_active: sponsor?.is_active ?? true,
    sort_order: Number(sponsor?.sort_order || 0),
  };
  const saved = sponsorId ? await db.from("sponsors").update(payload).eq("id", sponsorId).select("*").single() : await db.from("sponsors").insert(payload).select("*").single();
  if (saved.error) return saved;
  const usage = await synchronizeMediaAssignment("sponsor", saved.data.id, media.data?.id || null, "image");
  if (usage.error) {
    if (previous.data) await db.from("sponsors").update(previous.data).eq("id", saved.data.id);
    else await db.from("sponsors").delete().eq("id", saved.data.id);
    return actionError("Die Sponsorlogo-Verwendung konnte nicht gespeichert werden.");
  }
  return saved;
}

export async function deleteSponsorAction(sponsorId) {
  const auth = await assertAdminActionPermission({ requiredPermission: "sponsors.delete" });
  if (!auth.ok) return actionError(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return actionError("Sponsor-Service ist nicht konfiguriert.");
  const existing = await db.from("sponsors").select("id").eq("id", sponsorId).maybeSingle();
  if (existing.error || !existing.data) return actionError("Sponsor nicht gefunden.");
  const result = await db.from("sponsors").delete().eq("id", sponsorId);
  if (!result.error) await revalidatePublicContentAction("sponsors");
  return result;
}
