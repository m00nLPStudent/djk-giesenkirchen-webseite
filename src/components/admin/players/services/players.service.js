import { supabase } from "@/lib/supabase";

export async function uploadPlayerImage(file, folder = "players") {
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

export async function savePlayer(player, id = null) {
  const payload = {
    team_id: player.team_id || null,
    first_name: player.first_name || null,
    last_name: player.last_name || null,
    shirt_number: player.shirt_number ? Number(player.shirt_number) : null,
    position_de: player.position_de || null,
    position_en: player.position_en || null,
    image_url: player.photo_url || null,
    photo_url: player.photo_url || null,
    is_active: player.is_active ?? true,
    sort_order: Number(player.sort_order || 0),
    description_de: player.description_de || null,
    description_en: player.description_en || null,
    birthdate: player.birthdate || null,
    year_group: player.year_group || null,
    strong_foot: player.strong_foot || null,
    nationality: player.nationality || null,
    is_captain: player.is_captain ?? false,
  };

  console.log("PLAYER SAVE PAYLOAD", payload);

  if (id) {
    return await supabase
      .from("players")
      .update(payload)
      .eq("id", id)
      .select("*");
  }

  return await supabase.from("players").insert(payload).select("*");
}
