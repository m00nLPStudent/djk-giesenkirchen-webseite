import { isTeamTypeUsed, normalizeTeamTypePayload } from "./teamTypes.core";

export async function saveTeamType(db, form, id = null) {
  const payload = normalizeTeamTypePayload(form);
  if (!payload.name_de || !payload.slug || !payload.age_group || !payload.department_id) return { data: null, error: { message: "Bezeichnung, Anzeigename, Altersklasse und Abteilung sind erforderlich." } };
  const query = id ? db.from("team_templates").update(payload).eq("id", id) : db.from("team_templates").insert(payload);
  return query.select("*").maybeSingle();
}

export async function deleteTeamType(db, id, template) {
  const teamsResult = await db.from("teams").select("id, name_de, slug, age_group");
  if (teamsResult.error) return teamsResult;
  if (isTeamTypeUsed(template, teamsResult.data || [])) return { data: null, error: { message: "Diese Mannschaftsvorlage wird bereits verwendet und kann nicht gelöscht werden." }, used: true };
  return db.from("team_templates").delete().eq("id", id);
}
