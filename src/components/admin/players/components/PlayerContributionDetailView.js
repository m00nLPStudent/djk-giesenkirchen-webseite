import Link from "next/link";
import { FormAlert } from "@/components/admin/forms";
import ContributionStatusBadge from "@/components/admin/contributions/components/ContributionStatusBadge";
import {
  formatContributionAmount,
  formatContributionDate,
} from "@/components/admin/contributions/helpers/contributionFormatters";
import PlayerStatusBadge from "./PlayerStatusBadge";
import ArchiveButton from "@/components/admin/archiving/ArchiveButton";
import {
  loadPlayerArchivePreviewAction,
  removePlayerWithScopeAction,
} from "@/app/admin/players/actions";

function Metric({ label, value, emphasis = false }) {
  return (
    <div className={`px-4 py-3 ${emphasis ? "bg-amber-500/10" : ""}`}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

export default function PlayerContributionDetailView({
  player,
  canEdit = false,
  canArchive = false,
  contributionStatus = null,
  contributionVisibility = "none",
  contributionSeasonWarning = "",
}) {
  const teamLabels = (player.teamNames || []).length
    ? player.teamNames.join(" | ")
    : "Keine Mannschaft";
  const canOpenContributionDetail =
    contributionVisibility === "full" && contributionStatus?.contributionId;

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <Link
              href="/admin/players"
              className="inline-flex rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              &larr; Zurueck zu Spielern
            </Link>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-black text-white md:text-[2rem]">
                  {player.displayName}
                </h1>
                <PlayerStatusBadge active={player.isActive} />
                {contributionStatus ? (
                  <ContributionStatusBadge
                    status={contributionStatus.status}
                    isOverdue={contributionStatus.isOverdue}
                    compact
                    shortLabel={false}
                  />
                ) : null}
              </div>
              <p className="text-sm text-white/60 md:text-[0.95rem]">
                {teamLabels}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canOpenContributionDetail ? (
              <Link
                href={`/admin/contributions/${contributionStatus.contributionId}`}
                className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:border-red-500 hover:text-white"
              >
                Beitrag oeffnen
              </Link>
            ) : null}
            {canEdit ? (
              <Link
                href={`/admin/players/edit/${player.id}`}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Bearbeiten
              </Link>
            ) : null}
            {canArchive && player.isActive ? (
              <ArchiveButton
                entity="player"
                name={player.displayName}
                action={removePlayerWithScopeAction.bind(null, player.id)}
                previewAction={loadPlayerArchivePreviewAction.bind(null, player.id)}
              />
            ) : null}
          </div>
        </div>
      </section>

      {contributionSeasonWarning ? (
        <FormAlert className="border-amber-400/30 bg-amber-500/10 text-amber-50" tone="warning">
          {contributionSeasonWarning}
        </FormAlert>
      ) : null}

      {contributionVisibility !== "none" && !contributionSeasonWarning ? (
        contributionStatus?.hasContribution ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
            <h2 className="text-xl font-black text-white">Vereinsbeitrag</h2>
            <div
              className={`mt-5 grid overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 ${
                contributionVisibility === "full"
                  ? "divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5"
                  : "divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
              }`}
            >
              <Metric label="Status" value={contributionStatus.displayStatus} />
              {contributionVisibility === "full" ? (
                <Metric
                  label="Soll"
                  value={formatContributionAmount(contributionStatus.amountDue)}
                />
              ) : null}
              {contributionVisibility === "full" ? (
                <Metric
                  label="Gezahlt"
                  value={formatContributionAmount(contributionStatus.amountPaid)}
                />
              ) : null}
              <Metric
                label="Offen"
                value={formatContributionAmount(contributionStatus.amountOutstanding)}
                emphasis
              />
              <Metric
                label="Faelligkeit"
                value={formatContributionDate(contributionStatus.dueDate)}
              />
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
            Fuer die aktuelle Saison ist kein Vereinsbeitrag angelegt.
          </section>
        )
      ) : null}
    </div>
  );
}
