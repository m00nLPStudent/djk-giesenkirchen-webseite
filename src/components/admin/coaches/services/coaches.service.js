import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";
import { deleteMediaFile, uploadMediaFile } from "@/lib/storage";

export async function deleteCoachImage(imageUrl) {
  return await deleteMediaFile(imageUrl, {
    ignoredUrls: [COACH_PLACEHOLDER_IMAGE],
  });
}

export async function uploadCoachImage(file, coach = {}) {
  return await uploadMediaFile(file, {
    folder: "coaches",
    name: `${coach.name || "trainer"}-${coach.id || Date.now()}`,
    previousUrl: coach.image_url || coach.photo_url,
    ignoredUrls: [COACH_PLACEHOLDER_IMAGE],
  });
}
