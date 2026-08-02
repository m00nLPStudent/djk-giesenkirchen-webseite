const CONTRIBUTION_DEFAULT_TITLES = {
  regular: "Jahresbeitrag",
  admission_fee: "Aufnahmegebuehr",
  adjustment: "Nachberechnung",
  correction: "Korrektur",
  special_fee: "Sonderbeitrag",
};

function normalizeText(value) {
  return String(value || "").trim();
}

export function getContributionDefaultTitle(contributionKey = "") {
  return CONTRIBUTION_DEFAULT_TITLES[normalizeText(contributionKey)] || "";
}

export function isContributionTitleCustomized(title = "", contributionKey = "") {
  const normalizedTitle = normalizeText(title);
  const defaultTitle = getContributionDefaultTitle(contributionKey);

  if (!normalizedTitle) {
    return false;
  }

  return normalizedTitle !== defaultTitle;
}

export function resolveContributionTitleChange({
  currentTitle = "",
  previousContributionKey = "",
  nextContributionKey = "",
  hasManualTitle = false,
  isEdit = false,
}) {
  if (isEdit) {
    return {
      nextTitle: currentTitle,
      hasManualTitle,
    };
  }

  const nextDefaultTitle = getContributionDefaultTitle(nextContributionKey);
  const previousDefaultTitle = getContributionDefaultTitle(previousContributionKey);
  const normalizedTitle = normalizeText(currentTitle);
  const titleMatchesPreviousDefault =
    normalizedTitle && normalizedTitle === previousDefaultTitle;
  const shouldReplaceTitle =
    !normalizedTitle || !hasManualTitle || titleMatchesPreviousDefault;

  return {
    nextTitle: shouldReplaceTitle ? nextDefaultTitle : currentTitle,
    hasManualTitle: shouldReplaceTitle ? false : hasManualTitle,
  };
}

