import { supabase } from "@/lib/supabase";

export async function uploadCoachImage(file) {
  if (!file) return { data: null, error: null };

  const fileName = `coaches/${Date.now()}-${file.name}`;

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

export async function saveCoach(coach, id = null) {
  if (id) {
    return await supabase.from("coaches").update(coach).eq("id", id);
  }

  return await supabase.from("coaches").insert(coach);
}

export async function deleteCoach(id) {
  return await supabase.from("coaches").delete().eq("id", id);
}
