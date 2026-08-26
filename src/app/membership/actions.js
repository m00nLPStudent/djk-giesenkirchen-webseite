"use server";

import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { submitMembershipRequest } from "@/lib/membership/membership.service";
import { logWorkflowNotificationFailure, notifyMembershipWorkflow } from "@/components/admin/notifications/workflowNotifications.service";

export async function submitMembershipRequestAction(payload) {
  try {
    const client = createSupabaseAdminClient();
    if (!client) throw new Error("Membership-Submit-Client ist nicht konfiguriert.");
    const result = await submitMembershipRequest(payload, { client });
    if (result.error && result.error.code !== "VALIDATION_ERROR") {
      console.error("[membership-submit]", { message: result.error.message || "Datenbankfehler" });
      return { data: null, error: { message: "Die Anfrage konnte derzeit nicht gesendet werden. Bitte versuche es später erneut." } };
    }
    if (!result.error) {
      try {
        const notification = await notifyMembershipWorkflow({
          type: "membership_created",
          request: { ...result.submittedRequest, id: result.data?.id, notificationKey: crypto.randomUUID() },
        });
        logWorkflowNotificationFailure("membership-created", notification.error);
      } catch (notificationError) {
        logWorkflowNotificationFailure("membership-created", notificationError);
      }
    }
    return { data: null, error: result.error ? { message: result.error.message || "Die Anfrage konnte nicht gespeichert werden." } : null };
  } catch (error) {
    console.error("[membership-submit]", { message: error?.message || "Unbekannter Fehler" });
    return { data: null, error: { message: "Die Anfrage konnte derzeit nicht gesendet werden. Bitte versuche es später erneut." } };
  }
}
