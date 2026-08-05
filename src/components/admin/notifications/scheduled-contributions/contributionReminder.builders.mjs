const detail = "/admin/notifications";
const germanDate = (value) => new Intl.DateTimeFormat("de-DE", { dateStyle: "long", timeZone: "Europe/Berlin" }).format(new Date(`${value}T12:00:00Z`));

export function buildScheduledContributionNotification(contribution, reminder, recipient, context) {
  const finance = recipient.audience === "finance";
  const due = germanDate(contribution.dueDate);
  const financeLabels = {
    membership_payment_due_soon: ["Vereinsbeitrag wird fällig", `Der Vereinsbeitrag für ${contribution.playerDisplayName} wird am ${due} fällig.`],
    membership_payment_due_today: ["Vereinsbeitrag heute fällig", `Der Vereinsbeitrag für ${contribution.playerDisplayName} ist heute fällig.`],
    membership_payment_overdue: ["Vereinsbeitrag überfällig", `Der Vereinsbeitrag für ${contribution.playerDisplayName} ist überfällig.`],
    membership_payment_partial_open: ["Vereinsbeitrag teilweise offen", `Der Vereinsbeitrag für ${contribution.playerDisplayName} ist noch nicht vollständig beglichen.`],
    membership_payment_deferral_ending: ["Stundung endet", `Die Stundung des Vereinsbeitrags für ${contribution.playerDisplayName} endet heute.`],
  };
  const [title, message] = finance ? financeLabels[reminder.type] : ["Vereinsbeitrag weiterhin offen", `Für ${contribution.playerDisplayName} ist der Vereinsbeitrag noch nicht vollständig abgeschlossen.`];
  return {
    recipientUserId: recipient.userId, actorUserId: null, type: reminder.type, title, message,
    entityType: "player_contribution", entityId: contribution.id,
    targetUrl: finance ? `/admin/contributions/${contribution.id}` : detail,
    metadata: { contributionId: contribution.id, playerId: contribution.playerId, audience: recipient.audience, stage: reminder.stage, businessDate: context.businessDate, contributionYear: contribution.contributionYear, idempotencyKey: context.idempotencyKey },
  };
}
