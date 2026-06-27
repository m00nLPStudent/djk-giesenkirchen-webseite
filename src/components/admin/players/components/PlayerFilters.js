"use client";

import { useMemo, useState } from "react";
import { GENDER_OPTIONS } from "@/constants";

const defaultFilters = {
  sortBy: "name_asc",
  teamFilter: "all",
  genderFilter: "all",
  nationalityFilter: "all",
  positionFilter: "all",
  statusFilter: "all",
  captainFilter: "all",
};

export default function PlayerFilters({
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
  positionFilter,
  setPositionFilter,
  captainFilter,
  setCaptainFilter,
  sortBy,
  setSortBy,
  teams = [],
  positions = [],
  resultCount = 0,
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    sortBy,
    teamFilter,
    genderFilter,
    nationalityFilter,
    positionFilter,
    statusFilter,
    captainFilter,
  });

  const activeFilterCount = useMemo(() => {
    return [
      teamFilter !== "all",
      genderFilter !== "all",
      nationalityFilter !== "all",
      positionFilter !== "all",
      statusFilter !== "all",
      captainFilter !== "all",
      sortBy !== "name_asc",
    ].filter(Boolean).length;
  }, [teamFilter, genderFilter, nationalityFilter, positionFilter, statusFilter, captainFilter, sortBy]);

  function openPanel() {
    setDraft({ sortBy, teamFilter, genderFilter, nationalityFilter, positionFilter, statusFilter, captainFilter });
    setOpen(true);
  }

  function applyFilters() {
    setSortBy(draft.sortBy);
    setTeamFilter(draft.teamFilter);
    setGenderFilter(draft.genderFilter);
    setNationalityFilter(draft.nationalityFilter);
    setPositionFilter(draft.positionFilter);
    setStatusFilter(draft.statusFilter);
    setCaptainFilter(draft.captainFilter);
    setOpen(false);
  }

  function resetFilters() {
    setDraft(defaultFilters);
    setSortBy(defaultFilters.sortBy);
    setTeamFilter(defaultFilters.teamFilter);
    setGenderFilter(defaultFilters.genderFilter);
    setNationalityFilter(defaultFilters.nationalityFilter);
    setPositionFilter(defaultFilters.positionFilter);
    setStatusFilter(defaultFilters.statusFilter);
    setCaptainFilter(defaultFilters.captainFilter);
    setOpen(false);
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">Spielerliste</p>
          <p className="mt-1 text-sm text-white/50">
            {resultCount} Spieler gefunden{activeFilterCount > 0 ? ` • ${activeFilterCount} Filter aktiv` : ""}
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
          className="h-14 rounded-2xl bg-red-600 px-6 text-sm font-black text-white transition hover:bg-red-700"
        >
          Sortieren & Filter
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-red-600">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Filter schließen"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <aside className="absolute bottom-4 right-4 top-4 flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#101014] shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">Verwaltung</p>
                  <h2 className="mt-1 text-2xl font-black">Sortieren & Filter</h2>
                  <p className="mt-1 text-sm text-white/50">Kriterien auswählen und anwenden.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:border-red-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <FilterSelect label="Sortieren nach" value={draft.sortBy} onChange={(value) => updateDraft("sortBy", value)}>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="shirt_number">Rückennummer</option>
                <option value="age_asc">Alter: jung zuerst</option>
                <option value="age_desc">Alter: alt zuerst</option>
                <option value="year_group">Jahrgang</option>
                <option value="team">Mannschaft</option>
                <option value="position">Position</option>
                <option value="created_at">Neueste zuerst</option>
              </FilterSelect>

              <FilterSelect label="Mannschaft" value={draft.teamFilter} onChange={(value) => updateDraft("teamFilter", value)}>
                <option value="all">Alle Mannschaften</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </FilterSelect>

              <div>
                <FilterLabel>Geschlecht</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  <FilterChoice active={draft.genderFilter === "all"} label="Alle" onClick={() => updateDraft("genderFilter", "all")} />
                  {GENDER_OPTIONS.map((option) => (
                    <FilterChoice key={option.value} active={draft.genderFilter === option.value} label={option.label} onClick={() => updateDraft("genderFilter", option.value)} />
                  ))}
                </div>
              </div>

              {draft.nationalityFilter !== "all" && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
                  Nationalität-Filter ist aktiv.
                </div>
              )}

              <FilterSelect label="Position" value={draft.positionFilter} onChange={(value) => updateDraft("positionFilter", value)}>
                <option value="all">Alle Positionen</option>
                {positions.map((position) => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </FilterSelect>

              <div>
                <FilterLabel>Status</FilterLabel>
                <div className="grid grid-cols-3 gap-2">
                  <FilterChoice active={draft.statusFilter === "all"} label="Alle" onClick={() => updateDraft("statusFilter", "all")} />
                  <FilterChoice active={draft.statusFilter === "active"} label="Aktiv" onClick={() => updateDraft("statusFilter", "active")} />
                  <FilterChoice active={draft.statusFilter === "inactive"} label="Inaktiv" onClick={() => updateDraft("statusFilter", "inactive")} />
                </div>
              </div>

              <div>
                <FilterLabel>Spielführer</FilterLabel>
                <div className="grid grid-cols-3 gap-2">
                  <FilterChoice active={draft.captainFilter === "all"} label="Alle" onClick={() => updateDraft("captainFilter", "all")} />
                  <FilterChoice active={draft.captainFilter === "captain"} label="Nur" onClick={() => updateDraft("captainFilter", "captain")} />
                  <FilterChoice active={draft.captainFilter === "not_captain"} label="Ohne" onClick={() => updateDraft("captainFilter", "not_captain")} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5">
              <button type="button" onClick={resetFilters} className="h-12 rounded-full border border-white/10 px-5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white">
                Zurücksetzen
              </button>

              <button type="button" onClick={applyFilters} className="h-12 rounded-full bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700">
                Anwenden
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function FilterLabel({ children }) {
  return <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">{children}</label>;
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      <FilterLabel>{label}</FilterLabel>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-[#17171d] px-4 text-sm text-white outline-none transition focus:border-red-500">
        {children}
      </select>
    </div>
  );
}

function FilterChoice({ active, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`h-11 rounded-2xl border px-3 text-sm font-bold transition ${active ? "border-red-500 bg-red-600 text-white" : "border-white/10 bg-white/5 text-white/60 hover:border-red-500 hover:text-white"}`}>
      {label}
    </button>
  );
}
