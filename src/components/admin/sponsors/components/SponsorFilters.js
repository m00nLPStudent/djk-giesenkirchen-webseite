import { AdminModuleFilters, AdminStatusChip } from "@/components/admin/design-system";

export default function SponsorFilters({ status, setStatus }) {
  return <AdminModuleFilters title="Sponsoren filtern" panelId="sponsor-filter-panel" badge={status !== "all" ? <AdminStatusChip compact variant="blue">1 aktiv</AdminStatusChip> : null}><label className="grid max-w-sm gap-2 text-sm font-bold text-white/65">Aktivstatus<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white outline-none focus:border-red-500"><option value="all">Alle</option><option value="active">Aktiv</option><option value="inactive">Inaktiv</option></select></label></AdminModuleFilters>;
}
