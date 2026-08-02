"use client";

import { AdminButton, AdminModuleFilters, AdminModuleSearch } from "@/components/admin/design-system";

export default function TeamsHeaderSearchControls({ searchValue = "", statusValue = "active" }) {
  return (
    <div className="space-y-4">
      <form method="get" action="/admin/teams" className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AdminModuleSearch name="q" defaultValue={searchValue} label="Mannschaft suchen" placeholder="Mannschaft suchen …" />
        {statusValue !== "active" ? <input type="hidden" name="status" value={statusValue} /> : null}
        <AdminButton type="submit">Suchen</AdminButton>
      </form>
      <AdminModuleFilters title="Mannschaftsliste eingrenzen" panelId="team-filter-panel" badge={statusValue !== "active" ? <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-200">Status aktiv</span> : null}>
        <form method="get" action="/admin/teams" className="flex flex-col gap-3 sm:flex-row sm:items-end"><input type="hidden" name="q" value={searchValue} /><label className="space-y-2"><span className="block text-xs font-bold uppercase tracking-[0.15em] text-white/40">Aktivstatus</span><select name="status" defaultValue={statusValue} className="h-12 rounded-2xl border border-white/10 bg-neutral-950 px-4 text-white"><option value="active">Aktive</option><option value="inactive">Inaktive</option><option value="all">Alle</option></select></label><AdminButton type="submit" variant="primary">Filter anwenden</AdminButton></form>
      </AdminModuleFilters>
    </div>
  );
}
