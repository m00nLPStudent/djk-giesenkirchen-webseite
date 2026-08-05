"use server";

import { createServerActionSupabaseClient } from "@/lib/supabase.server";
import { submitMembershipRequest } from "@/lib/membership/membership.service";
import { logWorkflowNotificationFailure, notifyMembershipWorkflow } from "@/components/admin/notifications/workflowNotifications.service";

export async function submitMembershipRequestAction(payload) {
  const client = await createServerActionSupabaseClient();
  const result = await submitMembershipRequest(payload, { client });
  if (!result.error) {
    const notification = await notifyMembershipWorkflow({ type: "membership_created", request: { ...payload, notificationKey: crypto.randomUUID() } });
    logWorkflowNotificationFailure("membership-created", notification.error);
  }
  return { data: null, error: result.error ? { message: result.error.message || "Die Anfrage konnte nicht gespeichert werden." } : null };
}
