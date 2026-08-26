"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionPermission } from "@/lib/admin-auth/adminActionPermissions";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { forwardMembershipRequest, saveMembershipRequestStatus } from "@/lib/membership/membership.service";
import { logWorkflowNotificationFailure, notifyMembershipWorkflow } from "@/components/admin/notifications/workflowNotifications.service";
import { resolveMembershipRequestRecordAccess } from "@/components/admin/membership/membershipRequestRecordAccess.service";
import { getMembershipStatusNotificationPlan } from "@/components/admin/notifications/workflowNotification.core.mjs";

const failure = (message) => ({ data: null, error: { message } });

export async function saveMembershipRequestStatusAction(request, payload) {
  const access = await resolveMembershipRequestRecordAccess(request?.id);
  if (!access.ok || !access.canEdit) return failure("Du darfst diese Mitgliedsanfrage nicht bearbeiten.");
  if (access.isAssignedCoach && !["in_progress", "done"].includes(payload?.status)) return failure("Trainer dürfen den Status nur auf In Bearbeitung oder Erledigt setzen.");
  const auth = access.auth;
  const result = await saveMembershipRequestStatus(access.request, payload, { client: access.writeClient });
  if (!result.error && result.data) {
    const plan = getMembershipStatusNotificationPlan(access.request.status, result.data.status, { assignedCoach: access.isAssignedCoach });
    if (plan) {
      const notification = await notifyMembershipWorkflow({ type: plan.type, request: result.data, actorUserId: auth.profile?.id, targetEmail: result.data.forwarded_to_email, recipientMode: plan.recipientMode, actorName: access.isAssignedCoach ? access.request.forwarded_to_name : "" });
      logWorkflowNotificationFailure("membership-status", notification.error);
    }
    revalidatePath("/admin/membership-requests");
  }
  return result;
}

export async function forwardMembershipRequestAction(request, payload) {
  const auth = await assertAdminActionPermission({ requiredPermission: "membership_requests.forward" });
  if (!auth.ok) return failure(auth.message || "Berechtigung fehlt.");
  const db = createSupabaseAdminClient();
  if (!db) return failure("Serverzugriff ist derzeit nicht verfügbar.");
  const result = await forwardMembershipRequest(request, payload, { client: db });
  if (!result.error && result.data) {
    const type = request?.forwarded_to_id ? "membership_forwarded" : "membership_assigned";
    const notification = await notifyMembershipWorkflow({ type, request: result.data, actorUserId: auth.profile?.id, targetEmail: result.data.forwarded_to_email });
    logWorkflowNotificationFailure("membership-forward", notification.error);
    revalidatePath("/admin/membership-requests");
  }
  return result;
}
