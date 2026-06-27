import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { supabase } from "@/lib/supabase";
import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";

export async function deleteCoachImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [COACH_PLACEHOLDER_IMAGE],
  });
}

export async function uploadCoachImage(file, coach = {}) {
  return await uploadMediaFile(file, {
    folder: "coaches",
    name: `${coach.name || "trainer"}-${coach.id || Date.now()}`,
    previousUrl: coach.image_url,
    ignoredUrls: [COACH_PLACEHOLDER_IMAGE],
  });
}

export async function saveCoach(coach, id = null) {
  const payload = {
    ...coach,
    first_name: coach.first_name || null,
    last_name: coach.last_name || null,
    name: coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim(),
    team_id: coach.team_id || null,
    team_name: coach.team_id ? coach.team_name || null : null,
    image_url: coach.image_url || COACH_PLACEHOLDER_IMAGE,
    nationality: coach.nationality || null,
    sort_order: Number(coach.sort_order || 0),
    is_active: coach.is_active ?? true,
  };

  if (id) {
    return await supabase.from("coaches").update(payload).eq("id", id);
  }

  return await supabase.from("coaches").insert(payload);
}

export async function deleteCoachCompletely(coach) {
  const imageResult = await deleteCoachImage(coach?.image_url);

  if (imageResult?.error) {
    return imageResult;
  }

  return await supabase.from("coaches").delete().eq("id", coach.id);
}

export async function deleteCoach(id) {
  return await supabase.from("coaches").delete().eq("id", id);
}
