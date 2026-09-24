import "server-only";

import { findBoardResponsibilities } from "@/components/admin/board/boardResponsibilities.core.mjs";

export async function attachPublicBoardResponsibilities(db, members = []) {
  const roleIds = [...new Set(members.map((member) => member.role_id).filter(Boolean))];
  if (!roleIds.length) return { data: members.map((member) => ({ ...member, responsibilities: [] })), error: null };
  const result = await db.from("board_role_responsibilities")
    .select("organization_scope, department_id, role_id, responsibilities")
    .in("role_id", roleIds);
  if (result.error) return { data: [], error: result.error };
  return {
    data: members.map((member) => ({ ...member, responsibilities: findBoardResponsibilities(result.data || [], member) })),
    error: null,
  };
}
