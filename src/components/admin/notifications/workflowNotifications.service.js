import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase.admin";
import { createNotificationsOnce } from "./notifications.service";
import { buildContributionNotification, buildMemberStatusNotification, buildMembershipNotification, resolveWorkflowTarget } from "./workflowNotification.core.mjs";
import { createAdminNotificationRecipients, loadAdminNotificationRecipientSource } from "./workflowNotificationRecipients.repository";
import { loadCurrentSeasonResolution } from "@/components/admin/persons/currentSeasonRepository";
import { loadPlayerCurrentSeasonAssignmentRows } from "@/components/admin/players/services/playerWrite.repository";
import { resolveTeamNotificationRecipients } from "./teamAssignmentNotifications.service";
import { resolveMembershipNotificationRecipients } from "@/lib/membership/membershipResponsibility.core.mjs";

const uniqueWithoutActor = (items, actorUserId) => [...new Map(items.filter((item) => item.userId && item.userId !== actorUserId).map((item) => [item.userId, item])).values()];

async function loadRecipients(db) {
  const result = await loadAdminNotificationRecipientSource(db);
  return { recipients: result.data ? createAdminNotificationRecipients(result.data) : [], error: result.error };
}

async function deliver(db, event, recipients, actorUserId) {
  const inputs = uniqueWithoutActor(recipients, actorUserId).map((recipient) => ({ ...event, recipientUserId: recipient.userId, actorUserId, targetUrl: resolveWorkflowTarget(recipient, event) }));
  if (!inputs.length) return { delivered: 0, skipped: 0, error: null };
  const result = await createNotificationsOnce(inputs, { db });
  return { delivered: result.data?.length || 0, skipped: inputs.length - (result.data?.length || 0), error: result.error || null };
}

export function logWorkflowNotificationFailure(context, error) {
  if (error) console.error("[workflow-notification]", { context, message: error.message || "Unbekannter Notification-Fehler" });
}

export async function notifyMembershipWorkflow({ type, request, actorUserId = null, targetEmail = "", detailOnly = false, recipientMode = "target", actorName = "" }) {
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const loaded = await loadRecipients(db);
  if (loaded.error) return { delivered: 0, skipped: 0, error: loaded.error };
  const normalizedEmail = String(targetEmail || request?.forwarded_to_email || "").trim().toLowerCase();
  let targetProfileId = null;
  if (request?.forwarded_to_type === "coach" && request?.forwarded_to_id) {
    const coach = await db.from("coaches").select("admin_profile_id").eq("id", request.forwarded_to_id).maybeSingle();
    if (coach.error) return { delivered: 0, skipped: 0, error: coach.error };
    targetProfileId = coach.data?.admin_profile_id || null;
  }
  const policyRecipients = resolveMembershipNotificationRecipients(loaded.recipients, request?.request_type, { actorUserId })
    .map((recipient) => ({ ...recipient, canOpenMembershipRequest: true }));
  const recipients = type === "membership_created" || recipientMode === "membership_policy"
    ? policyRecipients
    : loaded.recipients.filter((recipient) => (targetProfileId && recipient.userId === targetProfileId) || (normalizedEmail && recipient.email.toLowerCase() === normalizedEmail));
  return deliver(db, buildMembershipNotification(type, request, { detailOnly, actorName, policyRecipient: type === "membership_created" || recipientMode === "membership_policy", assignedRecipient: type !== "membership_created" && recipientMode !== "membership_policy" }), recipients, actorUserId);
}

export async function notifyContributionWorkflow({ type, contribution, actorUserId }) {
  const db = createSupabaseAdminClient();
  if (!db) return { delivered: 0, skipped: 0, error: new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const loaded = await loadRecipients(db);
  if (loaded.error) return { delivered: 0, skipped: 0, error: loaded.error };
  const financeRecipients = loaded.recipients.filter((recipient) => {
    const roles = new Set(recipient.roleKeys);
    return recipient.permissionKeys.includes("contributions.view") && (roles.has("superadmin") || roles.has("kassierer") || roles.has("vorstand"));
  });
  const financeResult = await deliver(db, buildContributionNotification(type, contribution), financeRecipients, actorUserId);
  if (!contribution?.playerId) return financeResult;

  const season = await loadCurrentSeasonResolution(db);
  if (!season.activeSeasonId) return financeResult;
  const assignments = await loadPlayerCurrentSeasonAssignmentRows(db, contribution.playerId, season.activeSeasonId);
  if (assignments.error) return { ...financeResult, error: financeResult.error || assignments.error };
  const teamSeasonIds = [...new Set((assignments.data || []).filter((row) => row.isActive !== false).map((row) => row.teamSeasonId).filter(Boolean))];
  if (!teamSeasonIds.length) return financeResult;
  const trainers = await resolveTeamNotificationRecipients(db, teamSeasonIds, actorUserId);
  if (trainers.error) return { ...financeResult, error: financeResult.error || trainers.error };
  const trainerEvent = buildContributionNotification(type, contribution, { detailOnly: true, audience: "trainer" });
  const trainerResult = await deliver(db, trainerEvent, trainers.recipients, actorUserId);
  return { delivered: financeResult.delivered + trainerResult.delivered, skipped: financeResult.skipped + trainerResult.skipped, error: financeResult.error || trainerResult.error };
}

export async function notifyMemberStatusWorkflow({ type, player, teamSeasonId, actorUserId, detailOnly = false }) {
  const db = createSupabaseAdminClient();
  if (!db || !teamSeasonId) return { delivered: 0, skipped: 0, error: db ? null : new Error("Notification-Service-Client ist nicht konfiguriert.") };
  const { resolveTeamNotificationRecipients } = await import("./teamAssignmentNotifications.service");
  const resolved = await resolveTeamNotificationRecipients(db, [teamSeasonId], actorUserId);
  if (resolved.error) return { delivered: 0, skipped: 0, error: resolved.error };
  return deliver(db, buildMemberStatusNotification(type, player, { teamSeasonId, detailOnly }), resolved.recipients, actorUserId);
}
