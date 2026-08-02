"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { buildContributionQueryString } from "../helpers/contributionFilters.js";
import {
  CONTRIBUTION_FILTERS_DEFAULT_EXPANDED,
  getContributionFilterBadgeLabel,
} from "../helpers/contributionFilterUi.js";
import { CONTRIBUTION_NATIVE_SELECT_CLASSNAME } from "../helpers/contributionSelectStyles.js";
import {
  CONTRIBUTION_KEY_OPTIONS,
  CONTRIBUTION_SORT_OPTIONS,
  CONTRIBUTION_STATUS_OPTIONS,
} from "../helpers/contributionOptions.js";

function FilterField({ label, children }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterSelect({ label, name, defaultValue, children }) {
  return (
    <FilterField label={label}>
      <select
        name={name}
        defaultValue={defaultValue}
        className={`h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-red-500 ${CONTRIBUTION_NATIVE_SELECT_CLASSNAME}`}
      >
        {children}
      </select>
    </FilterField>
  );
}

export default function ContributionFilters({
  filters,
  filterOptions,
}) {
  const activeFilterBadge = getContributionFilterBadgeLabel(filters, filterOptions);
  const [expanded, setExpanded] = useState(CONTRIBUTION_FILTERS_DEFAULT_EXPANDED);
  const panelId = "contribution-filter-panel";

  return (
    <form className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3.5 md:p-4">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70">
            <SlidersHorizontal size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-white md:text-base">
                Beitragsliste eingrenzen
              </h2>
              {activeFilterBadge ? (
                <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-200">
                  {activeFilterBadge}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/75 transition hover:border-red-500 hover:text-white">
          <ChevronDown
            size={16}
            className={`transition ${expanded ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div id={panelId} className={expanded ? "mt-4" : "mt-4 hidden"}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterField label="Suche">
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Spieler oder Beitragstitel"
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none placeholder:text-white/35 focus:border-red-500"
            />
          </FilterField>

          <FilterSelect label="Saison" name="season" defaultValue={filters.seasonId}>
            <option value="">Alle Saisons</option>
            {(filterOptions.seasons || []).map((season) => (
              <option key={season.value} value={season.value}>
                {season.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Spieler" name="player" defaultValue={filters.playerId}>
            <option value="">Alle Spieler</option>
            {(filterOptions.players || []).map((player) => (
              <option key={player.value} value={player.value}>
                {player.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Mannschaft"
            name="team"
            defaultValue={filters.teamSnapshotName}
          >
            <option value="">Alle Snapshots</option>
            {(filterOptions.teams || []).map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect label="Status" name="status" defaultValue={filters.status}>
            <option value="">Alle Status</option>
            {CONTRIBUTION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Beitragstyp"
            name="type"
            defaultValue={filters.contributionKey}
          >
            <option value="">Alle Typen</option>
            {CONTRIBUTION_KEY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterField label="Faelligkeit">
            <input
              type="date"
              name="dueDate"
              defaultValue={filters.dueDate}
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none focus:border-red-500"
            />
          </FilterField>

          <FilterSelect label="Sortierung" name="sort" defaultValue={filters.sort}>
            {CONTRIBUTION_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Seitengroesse"
            name="pageSize"
            defaultValue={String(filters.pageSize)}
          >
            <option value="25">25</option>
            <option value="50">50</option>
          </FilterSelect>
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
          <input
            id="overdue"
            type="checkbox"
            name="overdue"
            value="true"
            defaultChecked={filters.overdue}
            className="h-4 w-4 rounded border-white/15 bg-black/20 text-red-500"
          />
          <label htmlFor="overdue">Nur ueberfaellige Beitraege</label>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="submit"
            className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700"
          >
            Filter anwenden
          </button>
          {activeFilterBadge ? (
            <Link
              href="/admin/contributions"
              className="rounded-full border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              Filter zuruecksetzen
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}

export function ContributionPagination({ pagination, filters }) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const previousQuery = buildContributionQueryString(filters, {
    page: String(pagination.page - 1),
  });
  const nextQuery = buildContributionQueryString(filters, {
    page: String(pagination.page + 1),
  });

  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65 md:flex-row md:items-center md:justify-between">
      <p>
        Seite {pagination.page} von {pagination.totalPages} | {pagination.totalCount} Treffer
      </p>

      <div className="flex flex-wrap gap-3">
        {pagination.hasPreviousPage ? (
          <Link
            href={`/admin/contributions?${previousQuery}`}
            className="rounded-full border border-white/10 px-4 py-2 font-bold text-white/75 transition hover:border-red-500 hover:text-white"
          >
            Vorherige
          </Link>
        ) : (
          <span className="rounded-full border border-white/10 px-4 py-2 text-white/30">
            Vorherige
          </span>
        )}

        {pagination.hasNextPage ? (
          <Link
            href={`/admin/contributions?${nextQuery}`}
            className="rounded-full border border-white/10 px-4 py-2 font-bold text-white/75 transition hover:border-red-500 hover:text-white"
          >
            Naechste
          </Link>
        ) : (
          <span className="rounded-full border border-white/10 px-4 py-2 text-white/30">
            Naechste
          </span>
        )}
      </div>
    </div>
  );
}
