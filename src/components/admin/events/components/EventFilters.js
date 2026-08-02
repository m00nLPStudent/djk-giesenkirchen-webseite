import { AdminModuleFilters, AdminStatusChip } from "@/components/admin/design-system";

const STATUS_OPTIONS = [["alle", "Alle Status"], ["geplant", "Geplant"], ["veroeffentlicht", "Veröffentlicht"], ["entwurf", "Entwurf"], ["vergangen", "Vergangen"]];
const SOURCE_OPTIONS = [["alle", "Alle Quellen"], ["verein", "Verein"], ["mannschaft", "Mannschaft"]];

function FilterSelect({ label, value, onChange, options }) {
  return <label className="grid gap-2 text-sm font-bold text-white/65">{label}<select value={value} onChange={onChange} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white outline-none focus:border-red-500">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

export default function EventFilters({ status, setStatus, source, setSource }) {
  const activeCount = Number(status !== "alle") + Number(source !== "alle");
  return <AdminModuleFilters title="Termine filtern" panelId="event-filter-panel" badge={activeCount ? <AdminStatusChip compact variant="blue">{activeCount} aktiv</AdminStatusChip> : null}><div className="grid gap-4 md:grid-cols-2"><FilterSelect label="Status" value={status} onChange={(event) => setStatus(event.target.value)} options={STATUS_OPTIONS} /><FilterSelect label="Quelle" value={source} onChange={(event) => setSource(event.target.value)} options={SOURCE_OPTIONS} /></div></AdminModuleFilters>;
}
