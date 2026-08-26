import "server-only";

export async function loadActiveTeamDepartments(db) {
  return db.from("departments").select("id, name_de, slug, is_active").eq("is_active", true).order("sort_order").order("name_de");
}

export async function findTeamDepartmentById(db, departmentId) {
  return db.from("departments").select("id, name_de, slug, is_active").eq("id", departmentId).maybeSingle();
}
