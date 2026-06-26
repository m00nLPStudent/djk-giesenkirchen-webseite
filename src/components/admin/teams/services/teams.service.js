import { supabase } from "@/lib/supabase";

export async function uploadTeamImage(file, folder = "teams") {
  if (!file) return { data: null, error: null };

  const fileName = `${folder}/${Date.now()}-${file.name}`;

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

export async function saveTeam(team, id = null) {
  if (id) {
    return await supabase.from("teams").update(team).eq("id", id);
  }

  return await supabase.from("teams").insert(team);
}
