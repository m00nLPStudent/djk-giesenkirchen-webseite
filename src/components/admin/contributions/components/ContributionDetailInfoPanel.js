import AdminPanel from "@/components/admin/common/AdminPanel";
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
          <div
            key={label}
            className="grid gap-1 px-4 py-3.5 sm:grid-cols-[minmax(8rem,0.9fr)_minmax(0,1.1fr)] sm:items-start sm:gap-4"
          >
            <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/42">
              {label}
            </dt>
            <dd className="text-sm font-medium leading-6 text-white break-words whitespace-pre-wrap sm:text-right">
              {value || "-"}
            </dd>
          </div>
        ))}
      </dl>
    </AdminPanel>
  );
}
