import AdminPanel from "@/components/admin/common/AdminPanel";
import { AdminInformationRow } from "@/components/admin/design-system";
import { getContributionDetailInfoItems } from "../helpers/contributionDetailView.js";

export default function ContributionDetailInfoPanel({
  contribution,
  canSeeInternalNotes = false,
}) {
  const items = getContributionDetailInfoItems(contribution, {
    canSeeInternalNotes,
  });

  return (
    <AdminPanel className="p-5 md:p-6">
      <h3 className="text-xl font-black text-white">Beitragsinformationen</h3>
      <dl className="mt-4 divide-y divide-white/10 rounded-[1.35rem] border border-white/10 bg-black/20">
        {items.map(([label, value]) => (
          <AdminInformationRow
            key={label}
            align="right"
            className="px-4 py-3.5 sm:grid-cols-[minmax(8rem,0.9fr)_minmax(0,1.1fr)] sm:items-start sm:gap-4"
            labelClassName="text-[0.68rem] tracking-[0.14em] text-white/42"
            valueClassName="font-medium text-white"
          >
            {value || "-"}
          </AdminInformationRow>
        ))}
      </dl>
    </AdminPanel>
  );
}
