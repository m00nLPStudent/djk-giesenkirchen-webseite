"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { normalizeClubContactPayload } from "@/components/admin/settings/settings.service";
import { canManageMedia, loadMediaLibrary, resolveEntityImageMedia, synchronizeMediaAssignment, uploadMediaAsset } from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";

const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

async function authorize(contactId = null) {
  const auth = await assertAdminActionPermission({ requiredPermission: "settings.edit" });
  if (!auth.ok) return { ok: false, message: auth.message || "Berechtigung fehlt." };
  if (!contactId) return { ok: true, auth, contact: null };
  const result = await auth.supabaseServer.from("club_contacts").select("*").eq("id", contactId).maybeSingle();
  if (result.error || !result.data) return { ok: false, message: "Kontakt nicht gefunden." };
  return { ok: true, auth, contact: result.data };
}

export async function saveClubContactAction(form, contactId = null) {
  const access = await authorize(contactId);
  if (!access.ok) return { data: null, error: { message: access.message } };
  const payload = normalizeClubContactPayload(form);
  if (form?.remove_legacy_image === true) payload.image_url = null;
  if (!payload.role_de || !payload.contact_name) return { data: null, error: { message: "Rolle und Name sind erforderlich." } };
  const allowedVisibilities = canManageMedia(access.auth.roles) ? ["public", "admin"] : ["public"];
  const media = await resolveEntityImageMedia(form?.image_media_asset_id || null, { allowArchived: Boolean(access.contact?.image_media_asset_id === form?.image_media_asset_id), allowedVisibilities });
  if (media.error) return { data: null, error: { message: media.error.message } };
  const query = contactId
    ? access.auth.supabaseServer.from("club_contacts").update(payload).eq("id", contactId)
    : access.auth.supabaseServer.from("club_contacts").insert(payload);
  const saved = await query.select("*").maybeSingle();
  if (saved.error || !saved.data) return saved;
  const usage = await synchronizeMediaAssignment("club_contact", saved.data.id, media.data?.id || null);
  if (usage.error) {
    console.error("[club-contact-media-sync]", { code: usage.error.code || "CONTACT_MEDIA_SYNC_FAILED", message: usage.error.message || "Unbekannter Fehler" });
    return { data: null, error: { message: "Die Kontaktbild-Verwendung konnte nicht gespeichert werden." } };
  }
  revalidatePath("/admin/settings");
  revalidatePath("/kontakt");
  return { data: { ...saved.data, image_media_asset_id: media.data?.id || null, image_url: form?.remove_legacy_image === true ? null : saved.data.image_url }, error: null };
}

export async function deleteClubContactAction(contactId) {
  const access = await authorize(contactId);
  if (!access.ok) return { error: { message: access.message } };
  const result = await access.auth.supabaseServer.from("club_contacts").delete().eq("id", contactId);
  if (!result.error) { revalidatePath("/admin/settings"); revalidatePath("/kontakt"); }
  return result;
}

export async function loadClubContactMediaPickerAction(filters = {}, contactId = null) {
  const access = await authorize(contactId);
  if (!access.ok) return { ok: false, error: access.message, items: [], total: 0 };
  const allowed = canManageMedia(access.auth.roles) ? ["public", "admin"] : ["public"];
  const visibility = allowed.includes(filters.visibility) ? filters.visibility : allowed;
  const purpose = normalizePickerPurpose(filters.purpose, "cms");
  const result = await loadMediaLibrary({ ...filters, kind: "image", visibility, purpose, archived: "active" });
  return result.error ? { ok: false, error: "Medien konnten nicht geladen werden.", items: [], total: 0 } : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadClubContactMediaAction(formData, contactId = null) {
  const access = await authorize(contactId);
  if (!access.ok) return { ok: false, error: access.message };
  const file = formData.get("file");
  if (!file || !imageTypes.has(file.type)) return { ok: false, error: "Für Kontaktbilder sind nur JPEG, PNG und WebP erlaubt." };
  const uploaded = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "public", purpose: "cms" }, access.auth.profile.id);
  if (uploaded.error) return { ok: false, error: "Das Kontaktbild konnte nicht hochgeladen werden." };
  const resolved = await resolveEntityImageMedia(uploaded.data.id, { purpose: "cms" });
  return resolved.error ? { ok: false, error: "Das hochgeladene Bild konnte nicht geladen werden." } : { ok: true, item: resolved.data };
}
