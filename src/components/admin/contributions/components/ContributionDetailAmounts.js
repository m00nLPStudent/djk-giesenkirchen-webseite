import ContributionMoneyBar from "./ContributionMoneyBar";
import { getContributionDetailMoneyItems } from "../helpers/contributionMoneySummary.js";

export default function ContributionDetailAmounts({ contribution }) {
  return <ContributionMoneyBar items={getContributionDetailMoneyItems(contribution)} />;
}
