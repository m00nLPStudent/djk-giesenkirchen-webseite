import { formatContributionAmount } from "./contributionFormatters.js";
import { CONTRIBUTION_AMOUNT_SUMMARY_CONFIG } from "./contributionOptions.js";

export function getContributionOverviewMoneyItems(stats = {}) {
  return CONTRIBUTION_AMOUNT_SUMMARY_CONFIG.map((item) => ({
    ...item,
    value: formatContributionAmount(stats[item.key]),
  }));
}

export function getContributionDetailMoneyItems(contribution = {}) {
  return [
    {
      key: "amountDue",
      title: "Soll",
      value: formatContributionAmount(contribution.amountDue),
    },
    {
      key: "amountPaid",
      title: "Gezahlt",
      value: formatContributionAmount(contribution.amountPaid),
    },
    {
      key: "amountWaived",
      title: "Erlassen",
      value: formatContributionAmount(contribution.amountWaived),
    },
    {
      key: "amountOutstanding",
      title: "Offen",
      value: formatContributionAmount(contribution.amountOutstanding),
      emphasis: true,
    },
  ];
}
