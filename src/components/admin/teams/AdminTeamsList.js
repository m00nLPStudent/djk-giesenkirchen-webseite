"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatContributionAmount } from "@/components/admin/contributions/helpers/contributionFormatters";
import TeamEmptyState from "./components/TeamEmptyState";
import useTeamScope from "./useTeamScope";

function TeamContributionSummary({ summary }) {
  if (!summary) return null;

  const statusRows = [
    ["Bezahlt", summary.paidCount],
    ["Teilweise", summary.partiallyPaidCount],
    ["Offen", summary.openCount],
    ["Ueberfaellig", summary.overdueCount],
    ["Fehlt", summary.missingContributionCount],
  ];

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-red-300/90">
          Beitraege
        </p>
        <dl className="mt-3 space-y-2.5">
          {statusRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
            >
              <dt className="text-sm text-white/68">{label}</dt>
              <dd className="text-base font-black text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-red-300">
          Offener Gesamtbetrag
        </p>
        <p className="mt-3 text-3xl font-black text-white">
          {formatContributionAmount(summary.totalOutstanding)}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/45">
          Stand aktuelle Saison
        </p>
      </section>
    </div>
  );
}

function TeamMetaSummary({ team }) {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-red-300/90">
          Mannschaft
        </p>
        <dl className="mt-3 space-y-2.5">
          {[
            ["Spieler", team.players_count ?? 0],
            ["Trainer", team.coaches_count ?? 0],
            ["Kontakt", team.contact_name || "Nicht hinterlegt"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
            >
              <dt className="text-sm text-white/68">{label}</dt>
              <dd className="text-sm font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-red-300/90">
          Organisation
        </p>
        <dl className="mt-3 space-y-2.5">
          {[
            ["Training", team.training_times_de || "Nicht hinterlegt"],
            ["fussball.de", team.fussball_de_matches_widget_id || team.fussball_de_table_widget_id ? "Aktiv" : "Nicht aktiv"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0 last:pb-0"
            >
              <dt className="text-sm text-white/68">{label}</dt>
              <dd className="max-w-[65%] text-right text-sm font-bold text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export default function AdminTeamsList({
  teams = [],
  showContributionSummary = false,
}) {
  const { scopedTeams, hasTeamManagementScope } = useTeamScope(teams);

  return (
    <>
      {scopedTeams.length === 0 ? (
        <TeamEmptyState hasTeamManagementScope={hasTeamManagementScope} />
      ) : (
        <div className="space-y-4">
          {scopedTeams.map((team) => (
            <Link
              key={team.id}
              href={`/admin/teams/${team.id}`}
              className="block rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 transition hover:border-red-500/40 hover:bg-white/[0.06] md:p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-red-600/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-red-300">
                      {team.age_group || "Mannschaft"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                      Saison {team.public_season_name || "-"}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-white">{team.name_de}</h2>
                  <p className="mt-2 text-sm font-bold text-white/75">
                    {showContributionSummary
                      ? `${team.contributionSummary?.playerCount ?? team.players_count ?? 0} Spieler`
                      : `${team.players_count ?? 0} Spieler`}
                  </p>
                  <p className="mt-2 max-w-3xl text-sm text-white/58">
                    {team.description_de || "Keine Beschreibung hinterlegt."}
                  </p>
                </div>

                <div className="flex items-center justify-end text-white/35">
                  <ChevronRight size={20} aria-hidden="true" />
                </div>
              </div>

              {showContributionSummary ? (
                <TeamContributionSummary summary={team.contributionSummary} />
              ) : (
                <TeamMetaSummary team={team} />
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
