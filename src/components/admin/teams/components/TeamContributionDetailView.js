import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FormAlert } from "@/components/admin/forms";
import ContributionStatusBadge from "@/components/admin/contributions/components/ContributionStatusBadge";
import {
  formatContributionAmount,
  formatContributionDate,
} from "@/components/admin/contributions/helpers/contributionFormatters";
import ArchiveButton from "@/components/admin/archiving/ArchiveButton";
import { removeTeamWithScopeAction } from "@/app/admin/teams/actions";

function SummaryMetric({ label, value, emphasis = false }) {
  return (
    <div className={`px-4 py-3 ${emphasis ? "bg-amber-500/10" : ""}`}>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
    </div>
  );
}

function getAmountValue(status, key) {
  if (!status?.hasContribution) return "-";
  return formatContributionAmount(status[key] || "0.00");
}

export default function TeamContributionDetailView({
  team,
  canEdit = false,
  canArchive = false,
  activeCoachAssignments = 0,
  contributionVisibility = "none",
  contributionSeasonWarning = "",
  teamSummary = null,
  players = [],
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              href="/admin/teams"
              className="inline-flex rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              &larr; Zurueck zu Mannschaften
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-300">
                  {team.age_group || "Mannschaft"}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                  Saison {team.seasonName || "-"}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-black text-white md:text-[2rem]">
                {team.name_de}
              </h1>
              <p className="mt-2 text-sm text-white/60">
                {team.playerCount} Spieler in der aktuellen Saison
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <Link
                href={`/admin/teams/edit/${team.id}`}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Bearbeiten
              </Link>
            ) : null}
            {canArchive && team.is_active !== false ? (
              <ArchiveButton
                entity="team"
                name={team.name_de}
                action={removeTeamWithScopeAction.bind(null, team.id)}
                playerAssignments={team.playerCount}
                coachAssignments={activeCoachAssignments}
              />
            ) : null}
          </div>
        </div>
      </section>

      {contributionVisibility === "none" ? (
        <FormAlert className="border-white/10 bg-white/[0.04] text-white/75" tone="warning">
          Fuer deine Rolle werden in dieser Ansicht keine Beitragsdaten angezeigt.
        </FormAlert>
      ) : null}

      {contributionSeasonWarning ? (
        <FormAlert className="border-amber-400/30 bg-amber-500/10 text-amber-50" tone="warning">
          {contributionSeasonWarning}
        </FormAlert>
      ) : null}

      {teamSummary && !contributionSeasonWarning ? (
        <section className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04]">
          <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-7">
            <SummaryMetric label="Spieler" value={teamSummary.playerCount} />
            <SummaryMetric label="Bezahlt" value={teamSummary.paidCount} />
            <SummaryMetric label="Teilweise" value={teamSummary.partiallyPaidCount} />
            <SummaryMetric label="Offen" value={teamSummary.openCount} />
            <SummaryMetric label="Ueberfaellig" value={teamSummary.overdueCount} />
            <SummaryMetric label="Fehlt" value={teamSummary.missingContributionCount} />
            <SummaryMetric
              label="Offen gesamt"
              value={formatContributionAmount(teamSummary.totalOutstanding)}
              emphasis
            />
          </div>
        </section>
      ) : null}

      {contributionVisibility !== "none" && !contributionSeasonWarning ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
          <h2 className="text-xl font-black text-white">Vereinsbeitraege</h2>

          {players.length === 0 ? (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-white/15 bg-black/20 p-5 text-sm text-white/60">
              Fuer diese Mannschaft liegen in der aktuellen Saison keine aktiven Spielerzuordnungen vor.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {players.map((player) => (
                <Link
                  key={player.id}
                  href={`/admin/players/${player.id}`}
                  className="block rounded-[1.35rem] border border-white/10 bg-black/20 p-4 transition hover:border-red-500/40 hover:bg-black/30"
                >
                  <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(14rem,1.5fr)_minmax(12rem,1fr)_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)_minmax(6rem,0.7fr)_minmax(7rem,0.8fr)_3rem] xl:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-white">
                        {player.displayName}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {player.assignmentLabel}
                      </p>
                      {contributionVisibility === "full" && player.contributionStatus?.contributionId ? (
                        <span className="mt-2 inline-flex rounded-full border border-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/60">
                          Beitrag verfuegbar
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <ContributionStatusBadge
                        status={player.contributionStatus?.status || "none"}
                        isOverdue={player.contributionStatus?.isOverdue}
                        compact
                        shortLabel={false}
                      />
                    </div>

                    <span className="font-bold text-white">
                      {getAmountValue(player.contributionStatus, "amountDue")}
                    </span>
                    <span className="font-bold text-white">
                      {getAmountValue(player.contributionStatus, "amountPaid")}
                    </span>
                    <span className="font-bold text-white">
                      {getAmountValue(player.contributionStatus, "amountOutstanding")}
                    </span>
                    <span className="text-white/70">
                      {player.contributionStatus?.hasContribution
                        ? formatContributionDate(player.contributionStatus?.dueDate)
                        : "-"}
                    </span>

                    <span className="flex justify-end text-white/35">
                      <ChevronRight size={18} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
