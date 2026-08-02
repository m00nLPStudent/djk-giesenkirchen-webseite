import { AdminStatusChip } from "@/components/admin/design-system";
import { getSponsorStatus } from "../sponsorUi.helpers";

export default function SponsorStatus({ sponsor }) {
  const status = getSponsorStatus(sponsor);
  return <AdminStatusChip compact variant={status.variant}>{status.label}</AdminStatusChip>;
}
