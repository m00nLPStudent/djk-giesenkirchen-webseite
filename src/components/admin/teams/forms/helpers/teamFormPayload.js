import { createSlug } from "@/lib/slug";

export function createTeamFormPayload(form = {}) {
  const payload = { ...form };
  delete payload.coach_team_state;
  delete payload.description_en;
  delete payload.training_times_en;

  return {
    ...payload,
    contact_phone: form.contact_phone?.replace(/\s/g, "").replace(/\+/g, ""),
    slug: form.slug || createSlug(form.name_de),
    sort_order: Number(form.sort_order),
    is_active: form.is_active,
  };
}
