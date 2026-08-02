import ContributionMoneyBar from "./ContributionMoneyBar";
import { getContributionOverviewMoneyItems } from "../helpers/contributionMoneySummary.js";

export default function ContributionSummaryBar({ stats = {} }) {
  return <ContributionMoneyBar items={getContributionOverviewMoneyItems(stats)} />;
}
