import { AdminDetailHeader } from "@/components/admin/design-system";
import ContributionStatusBadge from "./ContributionStatusBadge";
import { getContributionDetailMeta } from "../helpers/contributionDetailView.js";

export default function ContributionDetailHeader({ contribution, actions = null }) {
  const meta = getContributionDetailMeta(contribution);
  return (
    <AdminDetailHeader
      backHref="/admin/contributions"
      backLabel="Zurueck zu Vereinsbeitraegen"
      backVariant="pill"
      title={contribution.playerDisplayName}
      status={<ContributionStatusBadge status={contribution.status} isOverdue={contribution.isOverdue} compact shortLabel={false} />}
      meta={meta}
      actions={actions}
    />
  );
}
