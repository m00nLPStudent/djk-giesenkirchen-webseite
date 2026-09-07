import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { loadMediaAssetForPicker } from "@/components/admin/media-library/media.service";

export async function resolveActiveDepartmentBySlug(db, slug) {
  if (!db || !slug) return { data: null, error: new Error("Abteilungskontext fehlt.") };
  const result = await db.from("departments").select("id, slug, name_de, is_active")
    .eq("slug", slug).eq("is_active", true).maybeSingle();
  if (result.error || !result.data) {
    return { data: null, error: result.error || new Error("Aktive Abteilung nicht gefunden.") };
  }
  return { data: result.data, error: null };
}

export async function loadDepartmentSectionEditorData(slug) {
  const db = createSupabaseAdminClient();
  if (!db) return { data: null, error: new Error("Section-Service ist nicht konfiguriert.") };
  const department = await resolveActiveDepartmentBySlug(db, slug);
  if (department.error) return department;
  const [sectionResult, trainingResult] = await Promise.all([
    db.from("department_sections").select("*").eq("department_id", department.data.id).maybeSingle(),
    db.from("department_training_times").select("*").eq("department_id", department.data.id)
      .order("sort_order", { ascending: true }).order("weekday", { ascending: true })
      .order("start_time", { ascending: true }),
  ]);
  if (sectionResult.error || trainingResult.error) {
    return { data: null, error: sectionResult.error || trainingResult.error };
  }
  const section = sectionResult.data || null;
  const selectedMedia = section?.image_media_asset_id
    ? (await loadMediaAssetForPicker(section.image_media_asset_id)).data || null
    : null;
  return {
    data: {
      department: department.data,
      section: section ? { ...section, selectedMedia } : null,
      trainingTimes: trainingResult.data || [],
    },
    error: null,
  };
}
