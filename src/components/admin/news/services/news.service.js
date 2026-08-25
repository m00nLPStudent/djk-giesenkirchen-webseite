import { supabase } from "@/lib/supabase";
import { logAdminSaveEvent } from "@/lib/admin-auth/adminSaveDiagnostics";

export async function createNews(news) {
  const result = await supabase.from("news").insert(news).select("*").single();

  logAdminSaveEvent({
    module: "news",
    mode: "create",
    step: "service.createNews",
    operation: "insert",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}

export async function updateNews(id, news) {
  const result = await supabase
    .from("news")
    .update(news)
    .eq("id", id)
    .select("*")
    .single();

  logAdminSaveEvent({
    module: "news",
    mode: "edit",
    step: "service.updateNews",
    operation: "update",
    success: !result.error,
    error: result.error,
    data: result.data,
  });

  return result;
}
