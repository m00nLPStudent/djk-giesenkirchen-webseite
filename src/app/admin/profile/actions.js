"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import {
  loadOwnProfileMediaAsset,
  loadOwnProfileMediaLibrary,
  synchronizeMediaAssignment,
  uploadMediaAsset,
} from "@/components/admin/media-library/media.service";

const clean = (value, max) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max + 1) : null;
};

async function authorizeOwnProfile() {
  const auth = await assertAdminActionPermission({});
  return auth.ok ? auth : null;
}

function refreshProfile() {
  revalidatePath("/admin/profile");
  revalidatePath("/admin");
}

export async function revalidateAdminProfileAction() {
  refreshProfile();
  return { ok: true };
}

export async function updateOwnDashboardProfileAction(input = {}) {
  const auth = await authorizeOwnProfile();
  if (!auth) return { ok: false, error: "Profil konnte nicht gespeichert werden." };
  const nickname = clean(input.nickname, 80);
  const phone = clean(input.phone, 40);
  if (nickname?.length > 80) return { ok: false, error: "Der Nickname darf maximal 80 Zeichen lang sein." };
  if (phone?.length > 40) return { ok: false, error: "Die Telefonnummer darf maximal 40 Zeichen lang sein." };
  const { error } = await auth.supabaseServer.rpc("update_own_dashboard_profile", { p_nickname: nickname, p_phone: phone });
  if (error) return { ok: false, error: "Profil konnte nicht gespeichert werden." };
  refreshProfile();
  return { ok: true, nickname, phone, message: "Dashboardprofil wurde gespeichert." };
}

export async function loadOwnProfileMediaAction(filters = {}) {
  const auth = await authorizeOwnProfile();
  if (!auth) return { ok: false, items: [], total: 0, error: "Profilbilder konnten nicht geladen werden." };
  const result = await loadOwnProfileMediaLibrary(auth.profile.id, filters);
  if (result.error) return { ok: false, items: [], total: 0, error: "Profilbilder konnten nicht geladen werden." };
  return { ok: true, items: result.data, total: result.count };
}

export async function loadOwnProfileAvatarAction() {
  const auth = await authorizeOwnProfile();
  if (!auth) return { ok: false, item: null, error: "Profilbild konnte nicht geladen werden." };
  const { data: profile, error: profileError } = await auth.supabaseServer
    .from("admin_profiles").select("profile_image_media_asset_id").eq("id", auth.profile.id).maybeSingle();
  if (profileError || !profile?.profile_image_media_asset_id) return { ok: !profileError, item: null, error: profileError ? "Profilbild konnte nicht geladen werden." : null };
  const result = await loadOwnProfileMediaAsset(auth.profile.id, profile.profile_image_media_asset_id);
  return result.error ? { ok: false, item: null, error: "Profilbild konnte nicht geladen werden." } : { ok: true, item: result.data };
}

export async function uploadOwnProfileMediaAction(formData) {
  const auth = await authorizeOwnProfile();
  if (!auth) return { ok: false, error: "Profilbild konnte nicht hochgeladen werden." };
  const file = formData.get("file");
  if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return { ok: false, error: "Nur JPEG-, PNG- und WebP-Bilder sind erlaubt." };
  const result = await uploadMediaAsset(file, { displayName: formData.get("displayName"), altText: formData.get("altText"), visibility: "admin", purpose: "profile" }, auth.profile.id);
  if (result.error) return { ok: false, error: result.stage === "validation" ? result.error.message : "Profilbild konnte nicht hochgeladen werden." };
  const resolved = await loadOwnProfileMediaAsset(auth.profile.id, result.data.id);
  if (resolved.error || !resolved.data) return { ok: false, error: "Das hochgeladene Profilbild konnte nicht geladen werden." };
  return { ok: true, item: resolved.data };
}

export async function assignOwnProfileAvatarAction(mediaAssetId) {
  const auth = await authorizeOwnProfile();
  if (!auth) return { ok: false, error: "Profilbild konnte nicht gespeichert werden." };
  let selected = null;
  if (mediaAssetId) {
    const resolved = await loadOwnProfileMediaAsset(auth.profile.id, mediaAssetId);
    if (resolved.error || !resolved.data) return { ok: false, error: "Dieses Profilbild ist nicht auswählbar." };
    selected = resolved.data;
  }
  const result = await synchronizeMediaAssignment("admin_profile", auth.profile.id, mediaAssetId || null, "avatar");
  if (result.error) return { ok: false, error: "Profilbild konnte nicht gespeichert werden." };
  refreshProfile();
  return { ok: true, item: selected, message: mediaAssetId ? "Profilbild wurde gespeichert." : "Profilbild wurde entfernt." };
}
