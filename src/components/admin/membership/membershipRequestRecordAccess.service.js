import "server-only";

import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { canAccessMembershipRequests } from "@/lib/admin-auth/membershipAccess";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { isMembershipRequestAssignedToCoach } from "./membershipRequestRecordAccess.core.mjs";
import { canAccessMembershipRequestType, resolveMembershipResponsibility } from "@/lib/membership/membershipResponsibility.core.mjs";

const keys = (values = []) => values.map((item) => item?.key || item).filter(Boolean);

export async function resolveMembershipRequestRecordAccess(requestId, { authenticate = assertAdminActionPermission } = {}) {
  const auth = await authenticate({ requiredPermission: null });
  if (!auth.ok) return { ok: false, reason: auth.reason || "unauthorized" };
  const permissionKeys = keys(auth.permissions || []);
  const roleKeys = keys(auth.roles || []);
  const hasModuleView = canAccessMembershipRequests({ roleKeys, permissionKeys });
  const isTrainerOnly = roleKeys.some((key) => ["trainer", "betreuer"].includes(key)) && !roleKeys.some((key) => ["superadmin", "vorstand", "jugendleiter", "jugendkoordinator"].includes(key));
  if (!hasModuleView && !isTrainerOnly) return { ok: false, reason: "membership-access-denied", auth };
  const db = createSupabaseAdminClient();
  if (!db) return { ok: false, reason: "server-access-unavailable", auth };
  const requestIdentity = await db.from("membership_requests").select("id, request_type, forwarded_to_type, forwarded_to_id").eq("id", requestId).maybeSingle();
  if (requestIdentity.error || !requestIdentity.data) return { ok: false, reason: "not-found", auth };
  const hasTypeView = hasModuleView && canAccessMembershipRequestType({ requestType: requestIdentity.data.request_type, roleKeys, permissionKeys, action: "view" });
  const canEditByResponsibility = canAccessMembershipRequestType({ requestType: requestIdentity.data.request_type, roleKeys, permissionKeys, action: "edit" });
  const canForwardByResponsibility = canAccessMembershipRequestType({ requestType: requestIdentity.data.request_type, roleKeys, permissionKeys, action: "forward" });

  let assignedCoachId = null;
  if (!hasTypeView && !canEditByResponsibility) {
    const coach = await db.from("coaches").select("id").eq("admin_profile_id", auth.profile?.id).eq("is_active", true).maybeSingle();
    if (coach.error) return { ok: false, reason: "coach-resolution-failed", auth };
    assignedCoachId = coach.data?.id || null;
  }
  const isAssignedCoach = isMembershipRequestAssignedToCoach(requestIdentity.data, assignedCoachId);
  if (!hasTypeView && !canEditByResponsibility && !isAssignedCoach) return { ok: false, reason: "record-access-denied", auth };

  const requestResult = await db.from("membership_requests").select("*, teams(name_de), team_seasons(name_de, seasons(name))").eq("id", requestId).maybeSingle();
  if (requestResult.error || !requestResult.data) return { ok: false, reason: "not-found", auth };

  const request = { ...requestResult.data, responsibility_label: resolveMembershipResponsibility(requestResult.data.request_type)?.label || "Nur Superadmin" };
  return { ok: true, auth, writeClient: db, request, isAssignedCoach, canEdit: canEditByResponsibility || isAssignedCoach, canForward: canForwardByResponsibility };
}
