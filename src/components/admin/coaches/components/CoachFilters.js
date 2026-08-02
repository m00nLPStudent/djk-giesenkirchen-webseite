"use client";

import { AdminModuleFilters } from "@/components/admin/design-system";

export default function CoachFilters({ status, setStatus }) {
  const badge = status !== "alle" ? <span className="rounded-full border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-red-200">Status aktiv</span> : null;
  return (
    <AdminModuleFilters title="Trainerliste eingrenzen" badge={badge} panelId="coach-filter-panel">
      <label className="block max-w-sm space-y-2"><span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full rounded-2xl border border-white/10 bg-neutral-950 px-4 text-white outline-none focus:border-red-500"><option value="alle">Alle</option><option value="aktiv">Aktiv</option><option value="inaktiv">Inaktiv</option></select></label>
    </AdminModuleFilters>
  );
}
