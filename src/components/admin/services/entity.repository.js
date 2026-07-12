import { supabase } from "@/lib/supabase";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";

export function createEntityRepository({ table }) {
  async function insert(payload) {
    const result = await supabase.from(table).insert(payload).select("*");

    logAdminSaveEvent({
      module: table,
      mode: "create",
      step: "repository.insert",
      operation: "insert",
      success: !result.error,
      error: result.error,
      data: result.data,
    });

    return result;
  }

  async function update(id, payload) {
    const result = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .select("*");

    logAdminSaveEvent({
      module: table,
      mode: "edit",
      step: "repository.update",
      operation: "update",
      success: !result.error,
      error: result.error,
      data: result.data,
    });

    return result;
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
