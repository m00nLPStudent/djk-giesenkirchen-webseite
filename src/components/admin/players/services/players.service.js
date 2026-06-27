import { supabase } from "@/lib/supabase";

export const PLAYER_PLACEHOLDER_IMAGE =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/players/Blanko.png";

function getStoragePathFromPublicUrl(url) {
  if (!url) return null;
  if (url === PLAYER_PLACEHOLDER_IMAGE) return null;

  const marker = "/storage/v1/object/public/media/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

function getFileExtension(fileName = "") {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension || "png";
}

function slugify(value = "spieler") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "spieler";
}

export async function deletePlayerImage(imageUrl) {
  const path = getStoragePathFromPublicUrl(imageUrl);

  if (!path) {
    return { error: null };
  }

  return await supabase.storage.from("media").remove([path]);
}

export async function uploadPlayerImage(file, player = {}) {
  if (!file) return { data: null, error: null };

  const previousPath = getStoragePathFromPublicUrl(player.photo_url);
  const extension = getFileExtension(file.name);
  const name = slugify(
    `${player.first_name || ""}-${player.last_name || ""}-${player.id || Date.now()}`,
  );
  const fileName = `players/${name}.${extension}`;

  if (previousPath && previousPath !== fileName) {
    await supabase.storage.from("media").remove([previousPath]);
  }

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, file, { upsert: true });

  if (error) {
    return { data: null, error };
  }

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);

  return {
    data: `${data.publicUrl}?v=${Date.now()}`,
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
    image_url: player.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    photo_url: player.photo_url || PLAYER_PLACEHOLDER_IMAGE,
    is_active: player.is_active ?? true,
    sort_order: Number(player.sort_order || 0),
    description_de: player.description_de || null,
    description_en: player.description_en || null,
    birthdate: player.birthdate || null,
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
