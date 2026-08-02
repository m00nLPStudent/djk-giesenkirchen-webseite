import Link from "next/link";
import ContributionStatusBadge from "./ContributionStatusBadge";
import { getContributionDetailMeta } from "../helpers/contributionDetailView.js";

export default function ContributionDetailHeader({
  contribution,
  actions = null,
}) {
  const meta = getContributionDetailMeta(contribution);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-4">
          <Link
            href="/admin/contributions"
            className="inline-flex rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            &larr; Zurueck zu Vereinsbeitraegen
          </Link>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 text-2xl font-black text-white md:text-[2rem]">
                {contribution.playerDisplayName}
              </h1>
              <ContributionStatusBadge
                status={contribution.status}
                isOverdue={contribution.isOverdue}
                compact
                shortLabel={false}
              />
            </div>
            {meta ? (
              <p className="text-sm text-white/60 md:text-[0.95rem]">{meta}</p>
            ) : null}
          </div>
        </div>

        {actions ? (
          <div className="lg:max-w-md lg:self-start">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
