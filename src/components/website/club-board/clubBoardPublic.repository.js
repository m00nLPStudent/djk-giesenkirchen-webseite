import "server-only";

import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { COACH_PLACEHOLDER_IMAGE as BOARD_PLACEHOLDER_IMAGE } from "@/constants/images";
import { supabase } from "@/lib/supabase";
import { createPublicClubBoardDto, selectPublicClubBoard } from "./clubBoardPublic.core.mjs";

export async function loadPublicClubBoard({ db = supabase, mediaLoader = loadPublicMediaUrlMap } = {}) {
  const result = await db
    .from("board_members")
    .select("first_name, last_name, role_de, image_media_asset_id, sort_order, is_active, organization_scope, department_id, board_roles(name_de)")
    .eq("organization_scope", "club")
    .is("department_id", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (result.error) return { data: [], error: result.error };

  const members = selectPublicClubBoard(result.data || []);
  const mediaResult = await mediaLoader(members.map((member) => member.imageMediaAssetId));
  const mediaUrls = !mediaResult?.error && mediaResult?.data instanceof Map ? mediaResult.data : new Map();

  return {
    data: members.map((member) => createPublicClubBoardDto(member, mediaUrls, BOARD_PLACEHOLDER_IMAGE)),
    error: null,
  };
}
