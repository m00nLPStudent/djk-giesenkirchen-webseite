import { supabase } from "@/lib/supabase";
import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";

export const PLAYER_PLACEHOLDER_IMAGE =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/players/Blanko.png";

export async function deletePlayerImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [PLAYER_PLACEHOLDER_IMAGE],
  });
}

export async function uploadPlayerImage(file, player = {}) {
  return await uploadMediaFile(file, {
    folder: "players",
    name: `${player.first_name || ""}-${player.last_name || ""}-${player.id || Date.now()}`,
    previousUrl: player.photo_url,
    ignoredUrls: [PLAYER_PLACEHOLDER_IMAGE],
  });
}

export async function savePlayer(player, id = null) {
  const payload = {
    team_id: player.team_id || null,
    first_name: player.first_name || null,
    last_name: player.last_name || null,
    shirt_number: player.shirt_number ? Number(player.shirt_number) : null,
    position_de: player.position_de || null,
    position_en: player.position_en || null,
    image_url: player.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    photo_url: player.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    is_active: player.is_active ?? true,
    sort_order: Number(player.sort_order || 0),
    description_de: player.description_de || null,
    description_en: player.description_en || null,
    birthdate: player.birthdate || null,
    joined_at: player.joined_at || null,
    year_group: player.year_group || null,
    strong_foot: player.strong_foot || null,
    nationality: player.nationality || null,
    gender: player.gender || null,
    is_captain: player.is_captain ?? false,
  };

  if (id) {
    return await supabase
      .from("players")
      .update(payload)
      .eq("id", id)
      .select("*");
  }

  return await supabase.from("players").insert(payload).select("*");
}
