import "server-only";

import { loadPublicMediaUrlMap } from "@/components/admin/media-library/media.service";
import { COACH_PLACEHOLDER_IMAGE as BOARD_PLACEHOLDER_IMAGE } from "@/constants/images";
import { supabase } from "@/lib/supabase";
import { createPublicClubBoardDto, selectPublicClubBoard } from "./clubBoardPublic.core.mjs";
import { attachPublicBoardResponsibilities } from "@/components/website/board/boardResponsibilities.repository";

export async function loadPublicClubBoard({ db = supabase, mediaLoader = loadPublicMediaUrlMap } = {}) {
  const result = await db
    .from("board_members")
    .select("id, role_id, first_name, last_name, role_de, phone, email, image_media_asset_id, sort_order, is_active, organization_scope, department_id, board_roles(name_de)")
    .eq("organization_scope", "club")
    .is("department_id", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (result.error) return { data: [], error: result.error };

  const withResponsibilities = await attachPublicBoardResponsibilities(db, result.data || []);
  if (withResponsibilities.error) return { data: [], error: withResponsibilities.error };
  const members = selectPublicClubBoard(withResponsibilities.data);
  const mediaResult = await mediaLoader(members.map((member) => member.imageMediaAssetId));
  const mediaUrls = !mediaResult?.error && mediaResult?.data instanceof Map ? mediaResult.data : new Map();

  return {
    data: members.map((member) => createPublicClubBoardDto(member, mediaUrls, BOARD_PLACEHOLDER_IMAGE)),
    error: null,
  };
}
