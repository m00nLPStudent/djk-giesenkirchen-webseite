import { supabase } from "@/lib/supabase";

export async function uploadNewsImage(file) {
  if (!file) return { data: null, error: null };

  const fileName = `news/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage.from("media").upload(fileName, file);

  if (error) {
    return { data: null, error };
  }

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);

  return {
    data: data.publicUrl,
    error: null,
  };
}

export async function createNews(news) {
  return await supabase.from("news").insert(news);
}

export async function updateNews(id, news) {
  return await supabase.from("news").update(news).eq("id", id);
}
