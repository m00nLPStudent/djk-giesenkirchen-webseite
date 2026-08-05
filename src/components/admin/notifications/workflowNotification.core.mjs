const CENTER = "/admin/notifications";

const text = (value, fallback) => String(value || "").trim() || fallback;
const personName = (item = {}) => `${item.first_name || item.playerFirstName || ""} ${item.last_name || item.playerLastName || ""}`.trim() || item.playerDisplayName || "Mitglied";

export function getMembershipStatusNotificationPlan(previousStatus, nextStatus, { assignedCoach = false } = {}) {
  if (!nextStatus || previousStatus === nextStatus) return null;
  if (nextStatus === "in_progress") return { type: "membership_processing", recipientMode: "target" };
  if (nextStatus === "done") return { type: "membership_completed", recipientMode: assignedCoach ? "membership_policy" : "target" };
  return null;
}

export function buildMembershipNotification(type, request = {}, context = {}) {
  const name = personName(request);
  const completedMessage = context.actorName ? `Die Mitgliedsanfrage von ${name} wurde von ${text(context.actorName, "Trainer")} als erledigt markiert.` : `Die Mitgliedsanfrage von ${name} wurde erledigt.`;
  const labels = {
    membership_created: ["Neue Mitgliedsanfrage", `Eine neue Mitgliedsanfrage von ${name} ist eingegangen.`],
    membership_assigned: ["Mitgliedsanfrage zugewiesen", `Die Mitgliedsanfrage von ${name} wurde dir zugewiesen.`],
    membership_forwarded: ["Mitgliedsanfrage weitergeleitet", `Die Mitgliedsanfrage von ${name} wurde an dich weitergeleitet.`],
    membership_processing: ["Mitgliedsanfrage in Bearbeitung", `Die Mitgliedsanfrage von ${name} ist jetzt in Bearbeitung.`],
    membership_completed: ["Mitgliedsanfrage erledigt", completedMessage],
    membership_accepted: ["Mitgliedsanfrage angenommen", `Die Mitgliedsanfrage von ${name} wurde angenommen.`],
    membership_rejected: ["Mitgliedsanfrage abgelehnt", `Die Mitgliedsanfrage von ${name} wurde abgelehnt.`],
    membership_archived: ["Mitgliedsanfrage archiviert", `Die Mitgliedsanfrage von ${name} wurde archiviert.`],
  };
  const [title, message] = labels[type] || ["Mitgliedsanfrage aktualisiert", `Die Mitgliedsanfrage von ${name} wurde aktualisiert.`];
  return {
    type, title, message, entityType: "membership_request", entityId: request.id || null,
    targetUrl: context.detailOnly ? CENTER : request.id ? `/admin/membership-requests/${request.id}` : "/admin/membership-requests",
    metadata: { requestId: request.id || null, requestType: request.request_type || null, assignedMembershipRequest: Boolean(context.assignedRecipient), membershipRecordTarget: Boolean(context.assignedRecipient || context.policyRecipient), status: request.status || null, completedByName: context.actorName || null, completedAt: request.processed_at || request.updated_at || null, teamName: request.teams?.name_de || null, yearGroup: request.year_group || null, idempotencyKey: `${type}:${request.id || request.notificationKey || "unknown"}:${context.changeKey || request.updated_at || request.created_at || "current"}`, ...(context.detailOnly ? { notificationDetailOnly: true } : {}) },
  };
}

export function buildContributionNotification(type, contribution = {}, context = {}) {
  const name = text(contribution.playerDisplayName, "Mitglied");
  const labels = {
    membership_payment_created: ["Vereinsbeitrag angelegt", `Für ${name} wurde ein Vereinsbeitrag angelegt.`],
    membership_payment_updated: ["Vereinsbeitrag geändert", `Der Vereinsbeitrag von ${name} wurde geändert.`],
    membership_payment_received: ["Zahlung eingegangen", `Für den Vereinsbeitrag von ${name} wurde eine Zahlung erfasst.`],
    membership_payment_confirmed: ["Zahlung bestätigt", `Eine Zahlung für den Vereinsbeitrag von ${name} wurde bestätigt.`],
    membership_payment_overdue: ["Zahlung überfällig", `Für ${name} ist eine Beitragszahlung überfällig.`],
    membership_payment_deleted: ["Zahlung storniert", `Eine Zahlung für den Vereinsbeitrag von ${name} wurde storniert.`],
  };
  const [title, message] = labels[type] || ["Vereinsbeitrag aktualisiert", `Der Vereinsbeitrag von ${name} wurde aktualisiert.`];
  return {
    type, title, message, entityType: "player_contribution", entityId: contribution.id || context.contributionId || null,
    targetUrl: context.detailOnly ? CENTER : `/admin/contributions/${contribution.id || context.contributionId || ""}`,
    metadata: { contributionId: contribution.id || context.contributionId || null, playerId: contribution.playerId || null, audience: context.audience || "finance", idempotencyKey: `${type}:${contribution.id || context.contributionId || "unknown"}:${context.changeKey || contribution.updatedAt || contribution.createdAt || "current"}`, ...(context.detailOnly ? { notificationDetailOnly: true } : {}) },
  };
}

export function buildMemberStatusNotification(type, player = {}, context = {}) {
  const name = personName(player);
  const labels = {
    member_activated: ["Mitglied aktiviert", `${name} wurde aktiviert.`],
    member_deactivated: ["Mitglied deaktiviert", `${name} wurde deaktiviert.`],
    member_archived: ["Mitglied archiviert", `${name} wurde archiviert und ist nicht mehr Teil der aktiven Mannschaft.`],
  };
  const [title, message] = labels[type] || ["Mitglied aktualisiert", `${name} wurde aktualisiert.`];
  return { type, title, message, entityType: "player", entityId: player.id || null, targetUrl: context.detailOnly ? CENTER : `/admin/players/${player.id}`, metadata: { playerId: player.id || null, teamSeasonId: context.teamSeasonId || null, idempotencyKey: `${type}:${player.id || "unknown"}:${context.changeKey || "current"}`, ...(context.detailOnly ? { notificationDetailOnly: true } : {}) } };
}

export function resolveWorkflowTarget(recipient = {}, event = {}) {
  if (event.metadata?.notificationDetailOnly) return CENTER;
  if (event.entityType === "membership_request") {
    if (event.metadata?.membershipRecordTarget && recipient.canOpenMembershipRequest && event.entityId) return `/admin/membership-requests/${event.entityId}`;
    if (event.metadata?.assignedMembershipRequest && event.entityId) return `/admin/membership-requests/${event.entityId}`;
    return recipient.permissionKeys?.includes("membership_requests.view") ? "/admin/membership-requests" : CENTER;
  }
  if (event.entityType === "player_contribution") return recipient.permissionKeys?.includes("contributions.view") ? event.targetUrl : CENTER;
  if (event.entityType === "player") return recipient.permissionKeys?.includes("players.view") ? event.targetUrl : CENTER;
  return CENTER;
}
