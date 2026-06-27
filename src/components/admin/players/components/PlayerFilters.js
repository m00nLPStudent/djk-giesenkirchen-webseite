export default function PlayerFilters({ filter, setFilter, search, setSearch }) {
  const filters = [
    { value: "alle", label: "Alle" },
    { value: "aktiv", label: "Aktiv" },
    { value: "pausiert", label: "Pausiert" },
    { value: "torwart", label: "Torwart" },
    { value: "feldspieler", label: "Feldspieler" },
  ];

  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <input
          placeholder="Spieler suchen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-white outline-none transition placeholder:text-white/30 focus:border-red-500"
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                filter === item.value
                  ? "bg-red-600 text-white"
                  : "border border-white/10 text-white/60 hover:border-red-500 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
