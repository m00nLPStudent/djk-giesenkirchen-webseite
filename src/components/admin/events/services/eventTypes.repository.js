export function loadEventTypes(db, { activeOnly = true } = {}) {
  let query = db
    .from("event_types")
    .select("id, name_de, name_en, slug, is_active, is_system, sort_order")
    .order("sort_order", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);
  return query;
}
