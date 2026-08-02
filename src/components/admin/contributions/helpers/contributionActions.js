import { getContributionUiState } from "./contributionUiState.js";

function createDetailActionHref(contributionId, actionKey) {
  return `/admin/contributions/${contributionId}?dialog=${actionKey}`;
}

export function buildContributionActionItems(contribution, permissions = []) {
  const permissionKeys = (permissions || []).map((item) => item?.key || item);
  const uiState = getContributionUiState(contribution, permissionKeys);
  const items = [
    {
      href: `/admin/contributions/${contribution.id}`,
      label: "Details",
      tone: "default",
    },
  ];

  if (uiState.canEdit) {
    items.push({
      href: `/admin/contributions/${contribution.id}/edit`,
      label: "Bearbeiten",
      tone: "default",
    });
  }

  if (uiState.canRecordPayment) {
    items.push({
      href: createDetailActionHref(contribution.id, "payment"),
      label: "Zahlung erfassen",
      tone: "default",
    });
  }

  if (uiState.canDefer) {
    items.push({
      href: createDetailActionHref(
        contribution.id,
        uiState.canResume ? "resume" : "defer",
      ),
      label: uiState.canResume ? "Stundung aufheben" : "Stundung",
      tone: "default",
    });
  }

  if (uiState.canExempt) {
    items.push({
      href: createDetailActionHref(contribution.id, "exempt"),
      label: "Befreien",
      tone: "default",
    });
  }

  if (uiState.canCancel) {
    items.push({
      href: createDetailActionHref(contribution.id, "cancel"),
      label: "Beitrag stornieren",
      tone: "danger",
    });
  }

  return items;
}

