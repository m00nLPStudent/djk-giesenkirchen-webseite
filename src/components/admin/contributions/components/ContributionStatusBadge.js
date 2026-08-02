import EntityBadge from "@/components/admin/ui/EntityBadge";
import { getContributionStatusLabel } from "../helpers/contributionFormatters.js";

const STATUS_VARIANTS = {
  none: "neutral",
  open: "warning",
  partially_paid: "blue",
  paid: "success",
  deferred: "warning",
  exempt: "blue",
  canceled: "neutral",
};

export default function ContributionStatusBadge({
  status,
  isOverdue = false,
  className = "",
  compact = false,
  shortLabel = compact,
}) {
  return (
    <div className={`flex min-w-0 flex-wrap items-center gap-1.5 ${className}`}>
      <EntityBadge
        variant={STATUS_VARIANTS[status] || "default"}
        className={compact ? "whitespace-nowrap px-2.5 py-1 text-[0.68rem] tracking-[0.12em]" : ""}
      >
        {getContributionStatusLabel(status, { compact: shortLabel })}
      </EntityBadge>
      {isOverdue && status !== "paid" && status !== "exempt" && status !== "canceled" && (
        <EntityBadge
          variant="red"
          className={compact ? "whitespace-nowrap px-2.5 py-1 text-[0.68rem] tracking-[0.12em]" : ""}
        >
          Ueberfaellig
        </EntityBadge>
      )}
    </div>
  );
}
