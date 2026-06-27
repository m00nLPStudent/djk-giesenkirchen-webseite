import { supabase } from "@/lib/supabase";
import { deleteMediaFile } from "@/lib/storage";

export async function deleteEntityWithImage({
  table,
  id,
  imageUrl,
  ignoredUrls = [],
}) {
  if (!table || !id) {
    return {
      data: null,
      error: new Error("Tabelle oder ID fehlt."),
    };
  }

  if (imageUrl) {
    const imageResult = await deleteMediaFile(imageUrl, { ignoredUrls });

    if (imageResult?.error) {
      return imageResult;
    }
  }

  return await supabase.from(table).delete().eq("id", id);
}
