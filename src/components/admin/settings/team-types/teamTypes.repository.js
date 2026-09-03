import "server-only";

export async function loadTeamTypes(db, { activeOnly = false, departmentId = null } = {}) {
  let query = db.from("team_templates").select("*, departments(id, slug, name_de)").order("sort_order", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  if (departmentId) query = query.eq("department_id", departmentId);
  return query;
}

export async function loadTeamTypeUsageRows(db) {
  return db.from("teams").select("id, name_de, slug, age_group");
}
