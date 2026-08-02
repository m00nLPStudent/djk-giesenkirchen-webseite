import Link from "next/link";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/layout/AdminLayout";
import ContributionEmptyState from "@/components/admin/contributions/components/ContributionEmptyState";
import ContributionFilters, {
  ContributionPagination,
} from "@/components/admin/contributions/components/ContributionFilters";
import ContributionSummaryBar from "@/components/admin/contributions/components/ContributionSummaryBar";
import ContributionsTable from "@/components/admin/contributions/components/ContributionsTable";
import {
  buildContributionQueryString,
} from "@/components/admin/contributions/helpers/contributionFilters.js";
import {
  getContributionUiState,
} from "@/components/admin/contributions/helpers/contributionUiState.js";
import {
  loadContributionsOverviewData,
} from "@/components/admin/contributions/services/contributionUiData.service.js";
import { resolveContributionServerContext } from "@/components/admin/contributions/services/contributionAccess.service";

export const dynamic = "force-dynamic";

function createExportHref(filters) {
  const query = buildContributionQueryString(filters);
  return query
    ? `/admin/contributions/export?${query}`
    : "/admin/contributions/export";
}

function createEmptyStateCopy(data, canCreate) {
  if (!data.hasAnyContributions) {
    return {
      title: "Noch keine Vereinsbeitraege vorhanden",
      description:
        "Sobald Beitraege angelegt wurden, erscheinen hier Kennzahlen, Filter und die responsive Liste.",
      actionHref: canCreate ? "/admin/contributions/new" : null,
      actionLabel: canCreate ? "Ersten Beitrag anlegen" : null,
    };
  }

  if (!data.currentSeasonId && !data.filters.seasonId) {
    return {
      title: "Keine aktuelle Saison festgelegt",
      description:
        "Lege zuerst eine aktuelle Saison fest oder filtere gezielt auf eine vorhandene Saison, um Beitragsdaten anzuzeigen.",
    };
  }

  if (data.filters.playerId) {
    return {
      title: "Dieser Spieler hat keine passenden Beitraege",
      description:
        "Fuer den gewaelten Spieler wurden mit dem aktuellen Filter keine Vereinsbeitraege gefunden.",
    };
  }

  return {
    title: "Keine Treffer fuer die aktuelle Auswahl",
    description:
      "Passe Filter, Suchtext oder Sortierung an, um wieder Beitraege in der Liste zu sehen.",
    actionHref: "/admin/contributions",
    actionLabel: "Filter zuruecksetzen",
  };
}

export default async function AdminContributionsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const access = await resolveContributionServerContext("contributions.view");

  if (!access.ok) {
    redirect("/admin/unauthorized?reason=missing-permission&permission=contributions.view");
  }

  const data = await loadContributionsOverviewData(
    access.readClient,
    resolvedSearchParams,
  );
  const permissionKeys = access.auth.permissions || [];
  const uiState = getContributionUiState(null, permissionKeys);
  const emptyState = createEmptyStateCopy(data, uiState.canCreate);

  return (
    <AdminLayout
      title="Vereinsbeitraege"
      subtitle="Finanzen"
      showHeader={false}
    >
      <div className="space-y-4">
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-red-300">
                Vereinsbeitraege
              </p>
              <h1 className="mt-2 text-2xl font-black text-white md:text-[2rem]">
                Vereinsbeitraege verwalten
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Serverseitig gefilterte Beitragsdaten fuer Saison, Spieler, Mannschaft und Zahlungsstatus.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {uiState.canExport && (
                <Link
                  href={createExportHref(data.filters)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/75 transition hover:border-red-500 hover:text-white"
                >
                  CSV exportieren
                </Link>
              )}
              {uiState.canCreate && (
                <Link
                  href="/admin/contributions/new"
                  className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Neuer Beitrag
                </Link>
              )}
            </div>
          </div>
        </section>

        <ContributionSummaryBar stats={data.stats} />
        <ContributionFilters
          filters={data.filters}
          filterOptions={data.filterOptions}
        />

        {data.contributions.length ? (
          <>
            <ContributionsTable contributions={data.contributions} />
            <ContributionPagination
              pagination={data.pagination}
              filters={data.filters}
            />
          </>
        ) : (
          <ContributionEmptyState {...emptyState} />
        )}
      </div>
    </AdminLayout>
  );
}
