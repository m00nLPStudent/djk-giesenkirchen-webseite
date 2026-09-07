import "server-only";
import { supabase } from "../supabase";
import { applyClubClosurePeriods } from "./closurePeriods";
import { selectPublishedDepartmentTrainingSlots } from "./departmentTrainingEvents.mjs";
import { getTrainingOccurrences } from "./virtualTraining";

function message(error, fallback) {
  return error?.message || fallback;
}

export async function getPublicDepartmentTrainingEvents({
  from,
  to,
  maxOccurrencesPerTraining = 180,
  supabaseClient = supabase,
} = {}) {
  const [trainingResult, departmentsResult, sectionsResult, closuresResult] = await Promise.all([
    supabaseClient.from("department_training_times").select("id, department_id, weekday, start_time, end_time, location_name, location_address, location_city, location_note, effective_from, effective_until, is_active, sort_order"),
    supabaseClient.from("departments").select("id, slug, name_de, is_active").eq("is_active", true),
    supabaseClient.from("department_sections").select("department_id, title_de, is_active, is_published").eq("is_active", true).eq("is_published", true),
    supabaseClient.from("club_closure_periods").select("*").eq("is_active", true),
  ]);

  if (trainingResult.error) throw new Error(message(trainingResult.error, "Fehler beim Laden der Department-Trainingszeiten."));
  if (departmentsResult.error) throw new Error(message(departmentsResult.error, "Fehler beim Laden der Departments."));
  if (sectionsResult.error) throw new Error(message(sectionsResult.error, "Fehler beim Laden der veröffentlichten Department-Seiten."));
  if (closuresResult.error) throw new Error(message(closuresResult.error, "Fehler beim Laden der Vereinsschließzeiten."));

  const slots = selectPublishedDepartmentTrainingSlots(
    trainingResult.data || [],
    departmentsResult.data || [],
    sectionsResult.data || [],
  );
  const occurrences = getTrainingOccurrences(slots, {
    from,
    to,
    maxOccurrencesPerTraining,
  });

  return applyClubClosurePeriods(occurrences, closuresResult.data || []);
}
