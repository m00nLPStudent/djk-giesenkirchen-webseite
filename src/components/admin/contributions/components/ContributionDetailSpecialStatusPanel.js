import AdminPanel from "@/components/admin/common/AdminPanel";
import { getContributionSpecialStatusSections } from "../helpers/contributionDetailView.js";

export default function ContributionDetailSpecialStatusPanel({ contribution }) {
  const sections = getContributionSpecialStatusSections(contribution);

  if (!sections.length) {
    return null;
  }

  return (
    <AdminPanel className="p-5 md:p-6">
      <h3 className="text-xl font-black text-white">Sonderstatus</h3>
      <div className="mt-4 space-y-4">
        {sections.map((section) => (
          <section
            key={section.key}
            className="rounded-[1.2rem] border border-white/10 bg-black/20 p-4"
          >
            <h4 className="text-sm font-black uppercase tracking-[0.16em] text-red-200">
              {section.title}
            </h4>
            <dl className="mt-3 grid gap-3">
              {section.items.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/42">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">{value || "-"}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </AdminPanel>
  );
}
