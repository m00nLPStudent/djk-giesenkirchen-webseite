import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AdminCard from "@/components/admin/common/AdminCard";
import ContributionStatusBadge from "./ContributionStatusBadge";
import {
  formatContributionAmount,
} from "../helpers/contributionFormatters.js";
import {
  CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS,
  getContributionOverviewHref,
} from "../helpers/contributionOverview.js";

function getColumnValue(contribution, key) {
  if (key === "player") {
    return contribution.playerDisplayName;
  }

  if (key === "outstanding") {
    return formatContributionAmount(contribution.amountOutstanding);
  }

  return "";
}

function ContributionMobileCard({ contribution }) {
  const href = getContributionOverviewHref(contribution.id);

  return (
    <Link
      href={href}
      aria-label={`Beitragsuebersicht von ${contribution.playerDisplayName} oeffnen`}
      className={`block rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-red-500/40 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 lg:hidden ${
        contribution.status === "canceled" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-white sm:text-lg">
            {contribution.playerDisplayName}
          </p>
          <div className="mt-2">
            <ContributionStatusBadge
              status={contribution.status}
              isOverdue={contribution.isOverdue}
              compact
            />
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-white/35" aria-hidden="true" />
      </div>

      <dl className="mt-4 grid gap-2 text-sm">
        <Row label="Offen" value={formatContributionAmount(contribution.amountOutstanding)} />
      </dl>
    </Link>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-white/42">
        {label}
      </dt>
      <dd className="text-right font-bold text-white">{value}</dd>
    </div>
  );
}

export default function ContributionsTable({ contributions = [] }) {
  if (!contributions.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {contributions.map((contribution) => (
        <ContributionMobileCard
          key={`${contribution.id}-mobile`}
          contribution={contribution}
        />
      ))}

      <AdminCard className="hidden overflow-hidden lg:block">
        <div className="grid grid-cols-[minmax(14rem,1.7fr)_minmax(9rem,0.95fr)_minmax(8rem,0.8fr)_3.5rem] gap-4 border-b border-white/10 px-5 py-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/45">
          {CONTRIBUTION_OVERVIEW_DESKTOP_COLUMNS.map((column) => (
            <span key={column.key}>{column.label}</span>
          ))}
        </div>

        <div>
          {contributions.map((contribution) => (
            <Link
              key={contribution.id}
              href={getContributionOverviewHref(contribution.id)}
              aria-label={`Beitragsuebersicht von ${contribution.playerDisplayName} oeffnen`}
              className={`grid grid-cols-[minmax(14rem,1.7fr)_minmax(9rem,0.95fr)_minmax(8rem,0.8fr)_3.5rem] items-center gap-4 border-t border-white/10 px-5 py-3.5 text-sm transition hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-red-400 ${
                contribution.status === "canceled" ? "opacity-70" : ""
              }`}
            >
              <span className="min-w-0 truncate font-bold text-white">
                {getColumnValue(contribution, "player")}
              </span>
              <span className="min-w-0">
                <ContributionStatusBadge
                  status={contribution.status}
                  isOverdue={contribution.isOverdue}
                  compact
                />
              </span>
              <span className="min-w-0 truncate font-bold text-white">
                {getColumnValue(contribution, "outstanding")}
              </span>
              <span className="flex items-center justify-end text-white/45">
                <ChevronRight size={18} aria-hidden="true" />
                <span className="sr-only">
                  Beitragsuebersicht von {contribution.playerDisplayName} oeffnen
                </span>
              </span>
            </Link>
          ))}
        </div>
      </AdminCard>
    </div>
  );
}
