import "server-only";

import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { supabase } from "@/lib/supabase";
import { createPublicDepartmentSectionDto } from "./departmentSectionPublic.core.mjs";

const unavailable = (error) => ({ data: null, error: error || new Error("Der Bereich ist nicht verfügbar.") });

export async function loadPublicDepartmentSection(departmentSlug, { db = supabase, mediaLoader = loadPublicMediaUrlMap, today } = {}) {
  if (typeof departmentSlug !== "string" || !/^[a-z0-9-]{1,120}$/.test(departmentSlug)) return unavailable();

  const sectionResult = await db.rpc("get_public_department_section", { p_department_slug: departmentSlug }).maybeSingle();
  if (sectionResult.error || !sectionResult.data) return unavailable(sectionResult.error);

  const departmentResult = await db.from("departments").select("id").eq("slug", departmentSlug).eq("is_active", true).maybeSingle();
  if (departmentResult.error || !departmentResult.data?.id) return unavailable(departmentResult.error);

  const trainingResult = await db.from("department_training_times")
    .select("department_id, weekday, start_time, end_time, location_name, location_address, location_city, location_note, effective_from, effective_until, is_active, sort_order")
    .eq("department_id", departmentResult.data.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });
  if (trainingResult.error) return unavailable(trainingResult.error);

  const mediaResult = await mediaLoader([sectionResult.data.image_media_asset_id]);
  if (mediaResult.error) return unavailable(mediaResult.error);
  const imageUrl = mediaResult.data.get(sectionResult.data.image_media_asset_id) || null;
  const dto = createPublicDepartmentSectionDto(sectionResult.data, trainingResult.data || [], imageUrl, { departmentId: departmentResult.data.id, today });
  return dto ? { data: dto, error: null } : unavailable();
}
