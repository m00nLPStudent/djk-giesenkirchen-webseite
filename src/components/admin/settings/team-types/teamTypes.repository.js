import "server-only";

export async function loadTeamTypes(db, { activeOnly = false } = {}) {
  let query = db.from("team_templates").select("*").order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  return query;
}

export async function loadTeamTypeUsageRows(db) {
  return db.from("teams").select("id, name_de, slug, age_group");
}
