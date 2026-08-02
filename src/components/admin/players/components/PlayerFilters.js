"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AdminButton, AdminModuleFilters } from "@/components/admin/design-system";
import PlayerFiltersDialog from "./PlayerFiltersDialog";

const defaultFilters = {
  sortBy: "name_asc",
  teamFilter: "all",
  genderFilter: "all",
  nationalityFilter: "all",
  positionFilter: "all",
  statusFilter: "active",
  captainFilter: "all",
  contributionFilter: "all",
};

export default function PlayerFilters(props) {
  const {
    statusFilter,
    setStatusFilter,
    teamFilter,
    setTeamFilter,
    genderFilter,
    setGenderFilter,
    nationalityFilter,
    setNationalityFilter,
    contributionFilter = "all",
    setContributionFilter = () => {},
    showContributionFilter = false,
    positionFilter,
    setPositionFilter,
    captainFilter,
    setCaptainFilter,
    sortBy,
    setSortBy,
    teams = [],
    positions = [],
    resultCount = 0,
  } = props;

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState({
    sortBy,
    teamFilter,
    genderFilter,
    nationalityFilter,
    contributionFilter,
    positionFilter,
    statusFilter,
    captainFilter,
  });

  const activeFilterCount = useMemo(
    () =>
      [
        teamFilter !== "all",
        genderFilter !== "all",
        nationalityFilter !== "all",
        showContributionFilter && contributionFilter !== "all",
        positionFilter !== "all",
        statusFilter !== "all",
        captainFilter !== "all",
        sortBy !== "name_asc",
      ].filter(Boolean).length,
    [
      captainFilter,
      contributionFilter,
      genderFilter,
      nationalityFilter,
      positionFilter,
      showContributionFilter,
      sortBy,
      statusFilter,
      teamFilter,
    ],
  );

  function openPanel() {
    setDraft({
      sortBy,
      teamFilter,
      genderFilter,
      nationalityFilter,
      contributionFilter,
      positionFilter,
      statusFilter,
      captainFilter,
    });
    setOpen(true);
  }

  function syncFiltersToUrl(nextDraft) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    const filterEntries = [
      ["sort", nextDraft.sortBy, defaultFilters.sortBy],
      ["team", nextDraft.teamFilter, defaultFilters.teamFilter],
      ["gender", nextDraft.genderFilter, defaultFilters.genderFilter],
      ["nationality", nextDraft.nationalityFilter, defaultFilters.nationalityFilter],
      ["position", nextDraft.positionFilter, defaultFilters.positionFilter],
      ["status", nextDraft.statusFilter, defaultFilters.statusFilter],
      ["captain", nextDraft.captainFilter, defaultFilters.captainFilter],
    ];

    filterEntries.forEach(([key, value, defaultValue]) => {
      if (!value || value === defaultValue) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    if (
      !showContributionFilter ||
      !nextDraft.contributionFilter ||
      nextDraft.contributionFilter === defaultFilters.contributionFilter
    ) {
      params.delete("contribution");
    } else {
      params.set("contribution", nextDraft.contributionFilter);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    });
  }

  function applyFilters() {
    setSortBy(draft.sortBy);
    setTeamFilter(draft.teamFilter);
    setGenderFilter(draft.genderFilter);
    setNationalityFilter(draft.nationalityFilter);
    setContributionFilter(draft.contributionFilter);
    setPositionFilter(draft.positionFilter);
    setStatusFilter(draft.statusFilter);
    setCaptainFilter(draft.captainFilter);
    syncFiltersToUrl(draft);
    setOpen(false);
  }

  function resetFilters() {
    setDraft(defaultFilters);
    setSortBy(defaultFilters.sortBy);
    setTeamFilter(defaultFilters.teamFilter);
    setGenderFilter(defaultFilters.genderFilter);
    setNationalityFilter(defaultFilters.nationalityFilter);
    setContributionFilter(defaultFilters.contributionFilter);
    setPositionFilter(defaultFilters.positionFilter);
    setStatusFilter(defaultFilters.statusFilter);
    setCaptainFilter(defaultFilters.captainFilter);
    syncFiltersToUrl(defaultFilters);
    setOpen(false);
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <AdminModuleFilters
      title="Spielerliste eingrenzen"
      panelId="player-filter-panel"
      badge={activeFilterCount > 0 ? <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-200">{activeFilterCount} aktiv</span> : null}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">{resultCount} Spieler gefunden</p>
        <AdminButton variant="primary" onClick={openPanel} disabled={isPending}>
          {isPending ? "Aktualisiert..." : "Sortieren & Filter"}
        </AdminButton>
      </div>

      <PlayerFiltersDialog
        open={open}
        draft={draft}
        teams={teams}
        positions={positions}
        showContributionFilter={showContributionFilter}
        onClose={() => setOpen(false)}
        onApply={applyFilters}
        onReset={resetFilters}
        onUpdateDraft={updateDraft}
      />
    </AdminModuleFilters>
  );
}
