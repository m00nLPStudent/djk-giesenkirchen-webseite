import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";
import { PLAYER_PLACEHOLDER_IMAGE as PLAYER_PLACEHOLDER } from "@/constants/images";

export const PLAYER_PLACEHOLDER_IMAGE = PLAYER_PLACEHOLDER;

export async function deletePlayerImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [PLAYER_PLACEHOLDER_IMAGE],
  });
}

export async function uploadPlayerImage(file, player = {}) {
  return await uploadMediaFile(file, {
    folder: "players",
    name: `${player.first_name || ""}-${player.last_name || ""}-${player.id || Date.now()}`,
    previousUrl: player.image_url || player.photo_url,
    ignoredUrls: [PLAYER_PLACEHOLDER_IMAGE],
  });
}
