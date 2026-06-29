export default function TeamFilters({ filter, setFilter, search, setSearch }) {
  const filters = [
    ["alle", "Alle"],
    ["jugend", "Jugend"],
    ["senioren", "Senioren"],
    ["damen", "Damen"],
    ["fupa", "FuPa"],
    ["aktiv", "Aktiv"],
    ["inaktiv", "Inaktiv"],
  ];

  return (
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-3">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === value
                ? "bg-red-600 text-white"
                : "border border-white/10 text-white/60 hover:border-red-500/40 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Mannschaft suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-500/60 lg:w-80"
      />
    </div>
  );
}
