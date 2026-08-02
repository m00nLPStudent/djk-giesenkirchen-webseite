function hasPermission(permissionSet, permissionKey) {
  return permissionSet.has(permissionKey);
}

function hasPaidAmount(contribution = {}) {
  const normalizedContribution = contribution || {};
  return Number.parseFloat(normalizedContribution.amountPaid || "0") > 0;
}

export function createContributionPermissionSet(permissionKeys = []) {
  return new Set((permissionKeys || []).filter(Boolean));
}

export function getContributionUiState(contribution, permissionKeys = []) {
  const permissionSet = createContributionPermissionSet(permissionKeys);
  const isLocked =
    contribution?.status === "canceled" || contribution?.status === "exempt";

  return {
    canView: hasPermission(permissionSet, "contributions.view"),
    canCreate: hasPermission(permissionSet, "contributions.create"),
    canEdit: hasPermission(permissionSet, "contributions.edit") && !isLocked,
    canSeeInternalNotes: hasPermission(permissionSet, "contributions.edit"),
    canRecordPayment:
      hasPermission(permissionSet, "contributions.record_payment") &&
      !["canceled", "exempt", "deferred", "paid"].includes(contribution?.status),
    canCancelPayment: hasPermission(
      permissionSet,
      "contributions.cancel_payment",
    ),
    canDefer:
      hasPermission(permissionSet, "contributions.defer") &&
      !["canceled", "exempt", "paid"].includes(contribution?.status),
    canResume:
      hasPermission(permissionSet, "contributions.defer") &&
      contribution?.status === "deferred",
    canExempt:
      hasPermission(permissionSet, "contributions.exempt") &&
      !["canceled", "exempt"].includes(contribution?.status) &&
      !hasPaidAmount(contribution),
    canCancel:
      hasPermission(permissionSet, "contributions.cancel") &&
      !["canceled", "exempt"].includes(contribution?.status),
    canExport: hasPermission(permissionSet, "contributions.export"),
    isLocked,
  };
}

export function normalizeContributionDialog(value = "") {
  const normalized = String(value || "").trim();
  const supportedDialogs = new Set([
    "payment",
    "cancel-payment",
    "defer",
    "resume",
    "exempt",
    "cancel",
  ]);

  return supportedDialogs.has(normalized) ? normalized : "";
}

export function getContributionNotice(copyKey = "") {
  const notices = {
    created: "Der Beitrag wurde erfolgreich angelegt.",
    updated: "Der Beitrag wurde erfolgreich aktualisiert.",
    payment_recorded: "Die Zahlung wurde erfolgreich erfasst.",
    payment_canceled: "Die Zahlung wurde erfolgreich storniert.",
    deferred: "Der Beitrag wurde erfolgreich gestundet.",
    resumed: "Die Stundung wurde erfolgreich aufgehoben.",
    exempted: "Der Beitrag wurde erfolgreich befreit.",
    canceled: "Der Beitrag wurde erfolgreich storniert.",
  };

  return notices[String(copyKey || "").trim()] || "";
}
