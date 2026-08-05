import "server-only";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canAccessMembershipRequests } from "@/lib/admin-auth/membershipAccess";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { isMembershipRequestAssignedToCoach } from "./membershipRequestRecordAccess.core.mjs";

const keys = (values = []) => values.map((item) => item?.key || item).filter(Boolean);

export async function resolveMembershipRequestRecordAccess(requestId, { authenticate = assertAdminActionPermission } = {}) {
  const auth = await authenticate({ requiredPermission: null });
  if (!auth.ok) return { ok: false, reason: auth.reason || "unauthorized" };
  const db = createSupabaseAdminClient();
  if (!db) return { ok: false, reason: "server-access-unavailable", auth };

  const permissionKeys = keys(auth.permissions || []);
  const roleKeys = keys(auth.roles || []);
  const hasFullView = canAccessMembershipRequests({ roleKeys, permissionKeys });
  const isTrainerOnly = roleKeys.some((key) => ["trainer", "betreuer"].includes(key)) && !roleKeys.some((key) => ["superadmin", "vorstand", "jugendleiter", "jugendkoordinator"].includes(key));
  const canEditGlobally = !isTrainerOnly && (permissionKeys.includes("membership_requests.edit") || roleKeys.includes("superadmin"));
  const canForward = permissionKeys.includes("membership_requests.forward") || roleKeys.includes("superadmin");
  const requestResult = await db.from("membership_requests").select("*, teams(name_de)").eq("id", requestId).maybeSingle();
  if (requestResult.error || !requestResult.data) return { ok: false, reason: "not-found", auth };

  let assignedCoachId = null;
  if (!hasFullView && !canEditGlobally) {
    const coach = await db.from("coaches").select("id").eq("admin_profile_id", auth.profile?.id).eq("is_active", true).maybeSingle();
    if (coach.error) return { ok: false, reason: "coach-resolution-failed", auth };
    assignedCoachId = coach.data?.id || null;
  }
  const isAssignedCoach = isMembershipRequestAssignedToCoach(requestResult.data, assignedCoachId);
  if (!hasFullView && !canEditGlobally && !isAssignedCoach) return { ok: false, reason: "record-access-denied", auth };

  return { ok: true, auth, writeClient: db, request: requestResult.data, isAssignedCoach, canEdit: canEditGlobally || isAssignedCoach, canForward };
}
