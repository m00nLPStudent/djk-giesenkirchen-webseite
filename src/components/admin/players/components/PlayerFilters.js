"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
    search,
    setSearch,
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
    <div className="mb-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            Spielerliste
          </p>
          <p className="mt-1 text-sm text-white/50">
            {resultCount} Spieler gefunden
            {activeFilterCount > 0 ? ` | ${activeFilterCount} Filter aktiv` : ""}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <input
          placeholder="Spieler suchen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
        />

        <button
          type="button"
          onClick={openPanel}
          disabled={isPending}
          className="h-14 rounded-2xl bg-red-600 px-6 text-sm font-black text-white transition hover:bg-red-700"
        >
          {isPending ? "Aktualisiert..." : "Sortieren & Filter"}
          {activeFilterCount > 0 ? (
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-red-600">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
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
    </div>
  );
}
