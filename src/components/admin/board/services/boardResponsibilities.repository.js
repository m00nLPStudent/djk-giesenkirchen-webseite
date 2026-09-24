import "server-only";

const TABLE = "board_role_responsibilities";

function targetQuery(query, target) {
  query = query.eq("organization_scope", target.organization_scope).eq("role_id", target.role_id);
  return target.department_id ? query.eq("department_id", target.department_id) : query.is("department_id", null);
}

export async function loadBoardResponsibilityConfigurations(db, scope = null) {
  let query = db.from(TABLE).select("organization_scope, department_id, role_id, responsibilities");
  if (scope?.organization_scope) query = query.eq("organization_scope", scope.organization_scope);
  if (scope?.organization_scope === "club") query = query.is("department_id", null);
  if (scope?.department_id) query = query.eq("department_id", scope.department_id);
  return await query;
}

export async function persistBoardResponsibilities(db, target, responsibilities) {
  if (!responsibilities.length) return await targetQuery(db.from(TABLE).delete(), target);

  const payload = { ...target, responsibilities };
  const updated = await targetQuery(db.from(TABLE).update({ responsibilities }), target).select("id").maybeSingle();
  if (updated.error || updated.data?.id) return updated;

  const inserted = await db.from(TABLE).insert(payload).select("id").maybeSingle();
  if (inserted.error?.code !== "23505") return inserted;

  return await targetQuery(db.from(TABLE).update({ responsibilities }), target).select("id").maybeSingle();
}
