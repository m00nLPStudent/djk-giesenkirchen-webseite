import { supabase } from "@/lib/supabase";
import { isTeamTypeUsed, normalizeTeamTypePayload } from "./teamTypes.core";

export async function saveTeamType(form, id = null) {
  const payload = normalizeTeamTypePayload(form);
  if (!payload.name_de || !payload.slug || !payload.age_group) return { data: null, error: { message: "Bezeichnung, Anzeigename und Altersklasse sind erforderlich." } };
  const query = id ? supabase.from("team_templates").update(payload).eq("id", id) : supabase.from("team_templates").insert(payload);
  return query.select("*").maybeSingle();
}

export async function deleteTeamType(id, template) {
  const teamsResult = await supabase.from("teams").select("id, name_de, slug, age_group");
  if (teamsResult.error) return teamsResult;
  if (isTeamTypeUsed(template, teamsResult.data || [])) return { data: null, error: { message: "Diese Mannschaftsvorlage wird bereits verwendet und kann nicht gelöscht werden." }, used: true };
  return supabase.from("team_templates").delete().eq("id", id);
}
