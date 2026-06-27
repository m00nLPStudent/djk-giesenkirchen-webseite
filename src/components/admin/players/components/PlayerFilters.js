import { GENDER_OPTIONS } from "@/constants";

export default function PlayerFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  teamFilter,
  setTeamFilter,
  genderFilter,
  setGenderFilter,
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
  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-400">
            Spielerliste
          </p>
          <p className="mt-1 text-sm text-white/50">
            {resultCount} Spieler gefunden
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.4fr_repeat(6,1fr)]">
        <input
          placeholder="Spieler suchen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
        />

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
          <option value="shirt_number">Rückennummer</option>
          <option value="age_asc">Alter: jung zuerst</option>
          <option value="age_desc">Alter: alt zuerst</option>
          <option value="year_group">Jahrgang</option>
          <option value="team">Mannschaft</option>
          <option value="position">Position</option>
          <option value="created_at">Neueste zuerst</option>
        </select>

        <select
          value={teamFilter}
          onChange={(event) => setTeamFilter(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="all">Alle Mannschaften</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        <select
          value={genderFilter}
          onChange={(event) => setGenderFilter(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="all">Alle Geschlechter</option>
          {GENDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={positionFilter}
          onChange={(event) => setPositionFilter(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="all">Alle Positionen</option>
          {positions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="all">Alle Status</option>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
        </select>

        <select
          value={captainFilter}
          onChange={(event) => setCaptainFilter(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#17171d] p-4 text-white outline-none transition focus:border-red-500"
        >
          <option value="all">Alle Spieler</option>
          <option value="captain">Nur Spielführer</option>
          <option value="not_captain">Ohne Spielführer</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setStatusFilter("all");
          setTeamFilter("all");
          setGenderFilter("all");
          setPositionFilter("all");
          setCaptainFilter("all");
          setSortBy("name_asc");
        }}
        className="mt-4 rounded-full border border-white/10 px-5 py-2 text-sm font-bold text-white/60 transition hover:border-red-500 hover:text-white"
      >
        Filter zurücksetzen
      </button>
    </div>
  );
}
