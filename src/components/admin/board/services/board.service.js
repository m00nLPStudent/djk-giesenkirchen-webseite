import { supabase } from "@/lib/supabase";
import { uploadMediaFile, deleteMediaFile } from "@/lib/storage";
import { COACH_PLACEHOLDER_IMAGE } from "@/constants/images";

export const BOARD_PLACEHOLDER_IMAGE = COACH_PLACEHOLDER_IMAGE;

export async function uploadBoardImage(file, member = {}) {
  return await uploadMediaFile(file, {
    folder: "board",
    name: `${member.first_name || "vorstand"}-${member.last_name || "mitglied"}-${member.id || Date.now()}`,
    previousUrl: member.image_url,
    ignoredUrls: [BOARD_PLACEHOLDER_IMAGE],
  });
}

export async function deleteBoardImage(imageUrl) {
  return await deleteMediaFile(imageUrl, { ignoredUrls: [BOARD_PLACEHOLDER_IMAGE] });
}

export async function saveBoardMember(member, id = null) {
  const payload = {
    first_name: member.first_name || null,
    last_name: member.last_name || null,
    role_de: member.role_de || null,
    role_en: member.role_en || null,
    email: member.email || null,
    phone: member.phone || null,
    image_url: member.image_url || BOARD_PLACEHOLDER_IMAGE,
    is_active: member.is_active ?? true,
    sort_order: Number(member.sort_order || 0),
  };

  if (id) {
    return await supabase.from("board_members").update(payload).eq("id", id).select("*");
  }

  return await supabase.from("board_members").insert(payload).select("*");
}
