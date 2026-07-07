import Link from "next/link";
import { Search, Plus } from "lucide-react";
import AdminPanel from "@/components/admin/common/AdminPanel";

export default function PermissionsToolbar({
  filters,
  categoryOptions,
  sortOptions,
  onSearchChange,
  onCategoryChange,
  onSortChange,
  onCreate,
}) {
  return (
    <AdminPanel>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_repeat(2,minmax(0,1fr))_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Permissions suchen</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45"
          />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Suche nach Name, Key oder Beschreibung"
            className="h-12 w-full rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 text-sm text-white placeholder:text-white/40 focus:border-red-500/50 focus:outline-none"
          />
        </label>

        <select
          value={filters.category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white focus:border-red-500/50 focus:outline-none"
        >
          {categoryOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900"
            >
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="h-12 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm text-white focus:border-red-500/50 focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-slate-900"
            >
              {option.label}
            </option>
          ))}
        </select>

        <Link
          href="/admin/permissions/matrix"
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-sm font-black text-white/80 transition hover:border-red-500/40 hover:text-white"
        >
          Matrix
        </Link>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700"
        >
          <Plus size={16} />
          Neue Permission
        </button>
      </div>
    </AdminPanel>
  );
}
