import { supabase } from "@/lib/supabase";

export function createEntityRepository({
  table,
}) {
  async function insert(payload) {
    return await supabase.from(table).insert(payload).select("*");
  }

  async function update(id, payload) {
    return await supabase.from(table).update(payload).eq("id", id).select("*");
  }

  async function upsert(payload, id = null) {
    if (id) return await update(id, payload);
    return await insert(payload);
  }

  async function remove(id) {
    return await supabase.from(table).delete().eq("id", id);
  }

  return {
    insert,
    update,
    upsert,
    remove,
  };
}
