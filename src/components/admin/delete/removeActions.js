import { supabase } from "@/lib/supabase";

async function removeEntity(entityType, entityId) {
  return await supabase.rpc("remove_entity", {
    entity_type: entityType,
    entity_uuid: entityId,
  });
}

export async function removePlayerRecord(player) {
  return await removeEntity("player", player?.id);
}

export async function removeCoachRecord(coach) {
  return await removeEntity("coach", coach?.id);
}

export async function removeTeamRecord(team) {
  return await removeEntity("team", team?.id);
}

export async function removeNewsRecord(news) {
  return await removeEntity("news", news?.id);
}

export async function removeBoardMemberRecord(member) {
  return await removeEntity("board_member", member?.id);
}

export async function removeSponsorRecord(sponsor) {
  return await removeEntity("sponsor", sponsor?.id);
}
