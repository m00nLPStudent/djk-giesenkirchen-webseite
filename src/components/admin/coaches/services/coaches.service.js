import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";
import { createEntityRepository } from "@/components/admin/services/entity.repository";
import { supabase } from "@/lib/supabase";

const coachRepository = createEntityRepository({
  table: "coaches",
  placeholderImage: COACH_PLACEHOLDER_IMAGE,
  imageFields: ["image_url"],
});

function resolveClient(client = null) {
  return client || supabase;
}

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

export async function saveCoach(coach, id = null, { client = null } = {}) {
  const db = resolveClient(client);
  const payload = {
    ...coach,
    first_name: coach.first_name || null,
    last_name: coach.last_name || null,
    name:
      coach.name || `${coach.first_name || ""} ${coach.last_name || ""}`.trim(),
    team_id: coach.team_id || null,
    team_name: coach.team_id ? coach.team_name || null : null,
    image_url: coach.image_url || COACH_PLACEHOLDER_IMAGE,
    nationality: coach.nationality || null,
    sort_order: Number(coach.sort_order || 0),
    is_active: coach.is_active ?? true,
  };

  if (!client) {
    return await coachRepository.upsert(payload, id);
  }

  if (id) {
    return await db.from("coaches").update(payload).eq("id", id).select("*");
  }

  return await db.from("coaches").insert(payload).select("*");
}
