import "server-only";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canAccessMembershipRequests } from "@/lib/admin-auth/membershipAccess";
import { createCoachReadDto } from "@/components/admin/persons/coachReadDto";
import { getCoachSeasonalReadModelsMap } from "@/components/admin/persons/coachSeasonalReadModelRepository";

const roleKeys = (auth) => (auth?.roles || []).map((item) => item?.key).filter(Boolean);
const permissionKeys = (auth) => (auth?.permissions || []).map((item) => item?.key || item).filter(Boolean);
const serializable = (value) => JSON.parse(JSON.stringify(value));

export async function loadMembershipRequestsPageData({ authenticate = assertAdminActionPermission } = {}) {
  const auth = await authenticate({ requiredPermission: null });
  if (!auth.ok) return { ok: false, reason: auth.reason || "unauthorized" };

  const context = { roleKeys: roleKeys(auth), permissionKeys: permissionKeys(auth) };
  if (!canAccessMembershipRequests(context)) return { ok: false, reason: "membership-access-denied" };

  const db = auth.supabaseServer;
  const [requestsResult, recipientsResult, coachesResult, boardMembersResult] = await Promise.all([
    db.from("membership_requests").select("*, teams(name_de)").order("created_at", { ascending: false }),
    db.from("membership_request_recipients").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    db.from("coaches").select("id, first_name, last_name, name, email, role, role_de, role_en").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    db.from("board_members").select("id, first_name, last_name, email, role_de").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ]);
  const errors = [requestsResult, recipientsResult, coachesResult, boardMembersResult].map((result) => result?.error).filter(Boolean);
  if (errors.length) return { ok: false, reason: "membership-load-failed", errors };

  const coachRows = coachesResult.data || [];
  const readModels = await getCoachSeasonalReadModelsMap(db, coachRows.map((coach) => coach.id).filter(Boolean));
  const coaches = coachRows.map((coach) => createCoachReadDto(coach, readModels.get(coach.id) || {}));
  return { ok: true, data: serializable({ requests: requestsResult.data || [], recipients: recipientsResult.data || [], coaches, boardMembers: boardMembersResult.data || [] }) };
}
