import { removePlayerWithScopeAction } from "@/app/admin/players/actions";
import { removeCoachWithScopeAction } from "@/app/admin/coaches/actions";
import { removeBoardMemberWithScopeAction } from "@/app/admin/department/board/actions";

export async function removePlayerRecord(player) {
  return await removePlayerWithScopeAction(player?.id);
}

export async function removeCoachRecord(coach) {
  return await removeCoachWithScopeAction(coach?.id);
}

export async function removeBoardMemberRecord(member) {
  return await removeBoardMemberWithScopeAction(member?.id);
}
