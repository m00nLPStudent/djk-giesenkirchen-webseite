"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import {
  loadMediaLibrary,
  resolveEntityImageMedia,
  synchronizeMediaAssignment,
  uploadMediaAsset,
} from "@/components/admin/media-library/media.service";
import { normalizePickerPurpose } from "@/components/admin/media-library/mediaPurpose.config.mjs";
import {
  normalizeDepartmentSectionPayload,
  normalizeDepartmentTrainingPayload,
} from "@/components/admin/department-sections/departmentSection.core.mjs";
import { resolveActiveDepartmentBySlug } from "@/components/admin/department-sections/departmentSection.service";

const DEPARTMENT_SLUG = "behindertensport";
const ADMIN_PATH = "/admin/behindertensport";
const fail = (message) => ({ ok: false, error: message });

async function authorizeEdit() {
  const auth = await assertAdminActionPermission({ requiredPermission: "department_sections.edit" });
  if (!auth.ok) return fail(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return fail("Section-Service ist nicht konfiguriert.");
  const department = await resolveActiveDepartmentBySlug(db, DEPARTMENT_SLUG);
  if (department.error) return fail("Der Behindertensport-Bereich ist nicht verfügbar.");
  return { ok: true, auth, db, department: department.data };
}

function refresh() {
  revalidatePath(ADMIN_PATH);
}

export async function saveDepartmentSectionAction(input = {}) {
  const access = await authorizeEdit();
  if (!access.ok) return access;
  const normalized = normalizeDepartmentSectionPayload(input);
  if (!normalized.ok) return fail(normalized.error);

  const existing = await access.db.from("department_sections").select("*")
    .eq("department_id", access.department.id).maybeSingle();
  if (existing.error) return fail("Der bestehende Bereich konnte nicht geprüft werden.");

  const requestedMediaId = input.image_media_asset_id || null;
  const media = await resolveEntityImageMedia(requestedMediaId, {
    allowArchived: existing.data?.image_media_asset_id === requestedMediaId,
    allowedVisibilities: ["public"],
  });
  if (media.error) return fail(media.error.message);

  const audit = { updated_by: access.auth.profile.id };
  const saved = existing.data
    ? await access.db.from("department_sections").update({ ...normalized.data, ...audit })
      .eq("id", existing.data.id).eq("department_id", access.department.id).select("*").single()
    : await access.db.from("department_sections").insert({
      ...normalized.data,
      department_id: access.department.id,
      image_media_asset_id: null,
      created_by: access.auth.profile.id,
      ...audit,
    }).select("*").single();
  if (saved.error || !saved.data) return fail("Der Bereich konnte nicht gespeichert werden.");

  const usage = await synchronizeMediaAssignment(
    "department_section", saved.data.id, media.data?.id || null, "image",
  );
  if (usage.error) {
    if (existing.data) {
      const restore = {
        title_de: existing.data.title_de,
        description_de: existing.data.description_de,
        contact_name: existing.data.contact_name,
        contact_email: existing.data.contact_email,
        contact_phone: existing.data.contact_phone,
        contact_is_public: existing.data.contact_is_public,
        is_active: existing.data.is_active,
        is_published: existing.data.is_published,
        updated_by: existing.data.updated_by,
      };
      await access.db.from("department_sections").update(restore).eq("id", existing.data.id);
    } else {
      await access.db.from("department_sections").delete().eq("id", saved.data.id);
    }
    return fail("Die Gruppenbild-Verwendung konnte nicht gespeichert werden.");
  }
  refresh();
  return { ok: true, data: { ...saved.data, image_media_asset_id: media.data?.id || null } };
}

async function loadOwnedTraining(access, trainingId) {
  if (!trainingId) return { data: null, error: "Trainingszeit fehlt." };
  const result = await access.db.from("department_training_times").select("*")
    .eq("id", trainingId).maybeSingle();
  if (result.error || !result.data) return { data: null, error: "Trainingszeit nicht gefunden." };
  if (result.data.department_id !== access.department.id) {
    return { data: null, error: "Diese Trainingszeit gehört nicht zum Behindertensport." };
  }
  return { data: result.data, error: null };
}

export async function createDepartmentTrainingAction(input = {}) {
  const access = await authorizeEdit();
  if (!access.ok) return access;
  const normalized = normalizeDepartmentTrainingPayload(input);
  if (!normalized.ok) return fail(normalized.error);
  const result = await access.db.from("department_training_times").insert({
    ...normalized.data,
    department_id: access.department.id,
    created_by: access.auth.profile.id,
    updated_by: access.auth.profile.id,
  }).select("*").single();
  if (result.error) return fail("Die Trainingszeit konnte nicht angelegt werden.");
  refresh();
  return { ok: true, data: result.data };
}

export async function updateDepartmentTrainingAction(trainingId, input = {}) {
  const access = await authorizeEdit();
  if (!access.ok) return access;
  const owned = await loadOwnedTraining(access, trainingId);
  if (owned.error) return fail(owned.error);
  const normalized = normalizeDepartmentTrainingPayload(input);
  if (!normalized.ok) return fail(normalized.error);
  const result = await access.db.from("department_training_times").update({
    ...normalized.data,
    updated_by: access.auth.profile.id,
  }).eq("id", owned.data.id).eq("department_id", access.department.id).select("*").single();
  if (result.error) return fail("Die Trainingszeit konnte nicht gespeichert werden.");
  refresh();
  return { ok: true, data: result.data };
}

export async function deleteDepartmentTrainingAction(trainingId) {
  const access = await authorizeEdit();
  if (!access.ok) return access;
  const owned = await loadOwnedTraining(access, trainingId);
  if (owned.error) return fail(owned.error);
  const result = await access.db.from("department_training_times").delete()
    .eq("id", owned.data.id).eq("department_id", access.department.id);
  if (result.error) return fail("Die Trainingszeit konnte nicht gelöscht werden.");
  refresh();
  return { ok: true };
}

export async function loadDepartmentSectionMediaPickerAction(filters = {}) {
  const access = await authorizeEdit();
  if (!access.ok) return { ...access, items: [], total: 0 };
  const purpose = normalizePickerPurpose(filters.purpose, "cms");
  const result = await loadMediaLibrary({
    ...filters, kind: "image", visibility: "public", purpose, archived: "active",
  });
  return result.error
    ? { ...fail("Medien konnten nicht geladen werden."), items: [], total: 0 }
    : { ok: true, items: result.data, total: result.count || 0 };
}

export async function uploadDepartmentSectionMediaAction(formData) {
  const access = await authorizeEdit();
  if (!access.ok) return access;
  const result = await uploadMediaAsset(formData.get("file"), {
    displayName: formData.get("displayName"),
    altText: formData.get("altText"),
    visibility: "public",
    purpose: "cms",
  }, access.auth.profile.id);
  if (result.error) {
    return fail(result.stage === "validation" ? result.error.message : "Das Gruppenbild konnte nicht hochgeladen werden.");
  }
  const resolved = await resolveEntityImageMedia(result.data.id, {
    allowedVisibilities: ["public"], purpose: "cms",
  });
  return resolved.error ? fail("Das hochgeladene Bild konnte nicht geladen werden.") : { ok: true, item: resolved.data };
}
