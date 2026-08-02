import { AdminModuleFilters } from "@/components/admin/design-system";

export default function NewsFilters({ filter, setFilter }) {
  const filters = [
    ["alle", "Alle"],
    ["veroeffentlicht", "Veröffentlicht"],
    ["geplant", "Geplant"],
    ["entwurf", "Entwürfe"],
  ];

  return (
    <AdminModuleFilters title="News filtern" badge={filter !== "alle" ? <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">1 aktiv</span> : null}>
      <div className="flex flex-wrap gap-3">
        {filters.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === value
                ? "bg-red-600 text-white"
                : "border border-white/10 text-white/60 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </AdminModuleFilters>
  );
}
