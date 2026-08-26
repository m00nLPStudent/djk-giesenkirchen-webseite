"use server";

import { revalidatePath } from "next/cache";
import { forwardMembershipRequest, saveMembershipRequestStatus } from "@/lib/membership/membership.service";
import { logWorkflowNotificationFailure, notifyMembershipWorkflow } from "@/components/admin/notifications/workflowNotifications.service";
import { resolveMembershipRequestRecordAccess } from "@/components/admin/membership/membershipRequestRecordAccess.service";
import { getMembershipStatusNotificationPlan } from "@/components/admin/notifications/workflowNotification.core.mjs";

const failure = (message) => ({ data: null, error: { message } });
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveForwardTarget(db, payload = {}) {
  const type = payload.forwarded_to_type;
  const id = String(payload.forwarded_to_id || "").trim();
  if (!["coach", "board"].includes(type) || !UUID_PATTERN.test(id)) return { data: null, error: { message: "Das Weiterleitungsziel ist ungültig." } };
  const table = type === "coach" ? "coaches" : "board_members";
  const fields = type === "coach" ? "id, first_name, last_name, name, email, is_active" : "id, first_name, last_name, email, is_active";
  const result = await db.from(table).select(fields).eq("id", id).eq("is_active", true).maybeSingle();
  if (result.error) return { data: null, error: { message: "Das Weiterleitungsziel konnte nicht geprüft werden." } };
  if (!result.data) return { data: null, error: { message: "Das Weiterleitungsziel existiert nicht oder ist inaktiv." } };
  const name = [result.data.first_name, result.data.last_name].filter(Boolean).join(" ").trim() || result.data.name || "Zielperson";
  return { data: { forwarded_to_type: type, forwarded_to_id: result.data.id, forwarded_to_name: name, forwarded_to_email: result.data.email || null, forwarded_note: payload.forwarded_note || null }, error: null };
}

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
  const access = await resolveMembershipRequestRecordAccess(request?.id);
  if (!access.ok || !access.canForward) return failure("Du darfst diese Mitgliedsanfrage nicht weiterleiten.");
  const target = await resolveForwardTarget(access.writeClient, payload);
  if (target.error) return failure(target.error.message);
  const result = await forwardMembershipRequest(access.request, target.data, { client: access.writeClient });
  if (!result.error && result.data) {
    const type = access.request?.forwarded_to_id ? "membership_forwarded" : "membership_assigned";
    const notification = await notifyMembershipWorkflow({ type, request: result.data, actorUserId: access.auth.profile?.id, targetEmail: result.data.forwarded_to_email });
    logWorkflowNotificationFailure("membership-forward", notification.error);
    revalidatePath("/admin/membership-requests");
  }
  return result;
}
