"use client";

import { GENDER_OPTIONS } from "@/constants";

export default function PlayerFiltersDialog({
  open = false,
  draft,
  teams = [],
  positions = [],
  showContributionFilter = false,
  onClose = () => {},
  onApply = () => {},
  onReset = () => {},
  onUpdateDraft = () => {},
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Filter schliessen"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <aside className="absolute bottom-4 right-4 top-4 flex w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#101014] shadow-2xl">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-400">
                Verwaltung
              </p>
              <h2 className="mt-1 text-2xl font-black">Sortieren & Filter</h2>
              <p className="mt-1 text-sm text-white/50">
                Kriterien auswaehlen und anwenden.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 transition hover:border-red-500 hover:text-white"
            >
              x
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <FilterSelect
            label="Sortieren nach"
            value={draft.sortBy}
            onChange={(value) => onUpdateDraft("sortBy", value)}
          >
            <option value="name_asc">Name A-Z</option>
            <option value="name_desc">Name Z-A</option>
            <option value="shirt_number">Rueckennummer</option>
            <option value="age_asc">Alter: jung zuerst</option>
            <option value="age_desc">Alter: alt zuerst</option>
            <option value="year_group">Jahrgang</option>
            <option value="team">Mannschaft</option>
            <option value="position">Position</option>
            <option value="created_at">Neueste zuerst</option>
          </FilterSelect>

          <FilterSelect
            label="Mannschaft"
            value={draft.teamFilter}
            onChange={(value) => onUpdateDraft("teamFilter", value)}
          >
            <option value="all">Alle Mannschaften</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </FilterSelect>

          <div>
            <FilterLabel>Geschlecht</FilterLabel>
            <div className="grid grid-cols-2 gap-2">
              <FilterChoice
                active={draft.genderFilter === "all"}
                label="Alle"
                onClick={() => onUpdateDraft("genderFilter", "all")}
              />
              {GENDER_OPTIONS.map((option) => (
                <FilterChoice
                  key={option.value}
                  active={draft.genderFilter === option.value}
                  label={option.label}
                  onClick={() => onUpdateDraft("genderFilter", option.value)}
                />
              ))}
            </div>
          </div>

          {showContributionFilter ? (
            <FilterSelect
              label="Vereinsbeitrag"
              value={draft.contributionFilter}
              onChange={(value) => onUpdateDraft("contributionFilter", value)}
            >
              <option value="all">Alle Status</option>
              <option value="open_cases">Offen + Teilweise + Ueberfaellig</option>
              <option value="open">Offen</option>
              <option value="partially_paid">Teilweise bezahlt</option>
              <option value="paid">Bezahlt</option>
              <option value="deferred">Gestundet</option>
              <option value="exempt">Befreit</option>
              <option value="canceled">Storniert</option>
              <option value="none">Kein Beitrag</option>
              <option value="overdue">Nur ueberfaellig</option>
            </FilterSelect>
          ) : null}

          {draft.nationalityFilter !== "all" ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
              Nationalitaet-Filter ist aktiv.
            </div>
          ) : null}

          <FilterSelect
            label="Position"
            value={draft.positionFilter}
            onChange={(value) => onUpdateDraft("positionFilter", value)}
          >
            <option value="all">Alle Positionen</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </FilterSelect>

          <div>
            <FilterLabel>Status</FilterLabel>
            <div className="grid grid-cols-3 gap-2">
              <FilterChoice
                active={draft.statusFilter === "all"}
                label="Alle"
                onClick={() => onUpdateDraft("statusFilter", "all")}
              />
              <FilterChoice
                active={draft.statusFilter === "active"}
                label="Aktiv"
                onClick={() => onUpdateDraft("statusFilter", "active")}
              />
              <FilterChoice
                active={draft.statusFilter === "inactive"}
                label="Inaktiv"
                onClick={() => onUpdateDraft("statusFilter", "inactive")}
              />
            </div>
          </div>

          <div>
            <FilterLabel>Spielfuehrer</FilterLabel>
            <div className="grid grid-cols-3 gap-2">
              <FilterChoice
                active={draft.captainFilter === "all"}
                label="Alle"
                onClick={() => onUpdateDraft("captainFilter", "all")}
              />
              <FilterChoice
                active={draft.captainFilter === "captain"}
                label="Nur"
                onClick={() => onUpdateDraft("captainFilter", "captain")}
              />
              <FilterChoice
                active={draft.captainFilter === "not_captain"}
                label="Ohne"
                onClick={() => onUpdateDraft("captainFilter", "not_captain")}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onReset}
            className="h-12 rounded-full border border-white/10 px-5 text-sm font-bold text-white/70 transition hover:border-red-500 hover:text-white"
          >
            Zuruecksetzen
          </button>

          <button
            type="button"
            onClick={onApply}
            className="h-12 rounded-full bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
          >
            Anwenden
          </button>
        </div>
      </aside>
    </div>
  );
}

function FilterLabel({ children }) {
  return (
    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/50">
      {children}
    </label>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      <FilterLabel>{label}</FilterLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-[#17171d] px-4 text-sm text-white outline-none transition focus:border-red-500"
      >
        {children}
      </select>
    </div>
  );
}

function FilterChoice({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 rounded-2xl border px-3 text-sm font-bold transition ${
        active
          ? "border-red-500 bg-red-600 text-white"
          : "border-white/10 bg-white/5 text-white/60 hover:border-red-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
