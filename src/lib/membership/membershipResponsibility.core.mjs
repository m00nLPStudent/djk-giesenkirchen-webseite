export const MEMBERSHIP_REQUEST_TYPES = Object.freeze([
  "aktives-mitglied-fussball",
  "aktives-mitglied-tischtennis",
  "aktives-mitglied-gymnastik-damen",
  "aktives-mitglied-behindertensport",
  "trainer-werden",
  "passives-mitglied",
  "sonstiges",
]);

export const MEMBERSHIP_RESPONSIBILITY = Object.freeze({
  "aktives-mitglied-fussball": { key: "football", label: "Fußball", requestLabel: "Aktives Mitglied Fußball", roleKeys: ["jugendleiter", "jugendkoordinator", "fussball-vorstand"] },
  "aktives-mitglied-tischtennis": { key: "table-tennis", label: "Tischtennis", requestLabel: "Aktives Mitglied Tischtennis", roleKeys: ["tischtennis-vorstand"] },
  "aktives-mitglied-gymnastik-damen": { key: "womens-gymnastics", label: "Damen-Gymnastik", requestLabel: "Aktives Mitglied Damen-Gymnastik", roleKeys: ["damen-gymnastik-vorstand"] },
  "aktives-mitglied-behindertensport": { key: "disabled-sports", label: "Behindertensport", requestLabel: "Aktives Mitglied Behindertensport", roleKeys: ["behindertensport-vorstand"] },
  "trainer-werden": { key: "club-board", label: "Vorstand Gesamtverein", requestLabel: "Trainer werden", roleKeys: ["vorstand"] },
  "passives-mitglied": { key: "club-board", label: "Vorstand Gesamtverein", requestLabel: "Passives Mitglied", roleKeys: ["vorstand"] },
  sonstiges: { key: "club-board-legacy", label: "Vorstand Gesamtverein (Legacy)", requestLabel: "Sonstige Mitgliedsanfrage", roleKeys: ["vorstand"] },
});

const keys = (values = []) => new Set((values || []).map((value) => value?.key || value).filter(Boolean));
const ACTION_PERMISSION = Object.freeze({ view: "membership_requests.view", edit: "membership_requests.edit", forward: "membership_requests.forward" });

export function resolveMembershipResponsibility(requestType) {
  return MEMBERSHIP_RESPONSIBILITY[requestType] || null;
}

export function getAllowedMembershipRequestTypes({ roleKeys = [], permissionKeys = [], action = "view" } = {}) {
  const roles = keys(roleKeys);
  const permissions = keys(permissionKeys);
  if (roles.has("superadmin")) return [...MEMBERSHIP_REQUEST_TYPES];
  const requiredPermission = ACTION_PERMISSION[action];
  if (!requiredPermission || !permissions.has(requiredPermission)) return [];
  if (roles.has("vorstand")) return [...MEMBERSHIP_REQUEST_TYPES];
  return MEMBERSHIP_REQUEST_TYPES.filter((type) => MEMBERSHIP_RESPONSIBILITY[type]?.roleKeys.some((role) => roles.has(role)));
}

export function canAccessMembershipRequestType(input = {}) {
  if (keys(input.roleKeys).has("superadmin")) return Boolean(input.requestType);
  return getAllowedMembershipRequestTypes(input).includes(input.requestType);
}

export function getMembershipNotificationRoleKeys(requestType, { includeSuperadmin = true } = {}) {
  const responsibility = resolveMembershipResponsibility(requestType);
  if (!responsibility) return includeSuperadmin ? ["superadmin"] : [];
  return [...new Set([...responsibility.roleKeys, ...(includeSuperadmin ? ["superadmin"] : [])])];
}

export function canReceiveMembershipPolicyNotification(recipient = {}, requestType) {
  const notificationRoles = new Set(getMembershipNotificationRoleKeys(requestType));
  return (recipient.roleKeys || []).some((role) => notificationRoles.has(role))
    && canAccessMembershipRequestType({ requestType, roleKeys: recipient.roleKeys, permissionKeys: recipient.permissionKeys, action: "view" });
}

export function resolveMembershipNotificationRecipients(candidates = [], requestType, { actorUserId = null } = {}) {
  return [...new Map((candidates || [])
    .filter((recipient) => recipient?.isActive !== false)
    .filter((recipient) => recipient?.userId && recipient.userId !== actorUserId)
    .filter((recipient) => canReceiveMembershipPolicyNotification(recipient, requestType))
    .map((recipient) => [recipient.userId, recipient])).values()];
}
