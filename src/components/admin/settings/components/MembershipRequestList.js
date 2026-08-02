import {
  AdminListChevron,
  AdminListHeader,
  AdminListMobileCard,
  AdminListRow,
  AdminModuleCards,
  AdminModuleEmptyState,
  AdminModuleList,
  AdminStatusChip,
} from "@/components/admin/design-system";

const template = "minmax(0,1.4fr) minmax(0,1fr) minmax(0,.8fr) minmax(0,.8fr) 2rem";
const columns = ["Antragsteller", "Mannschaft / Jahrgang", "Eingang", "Status", ""].map((label) => ({ key: label || "overview", label }));
const fullName = (item) => `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Anfrage";
const statusVariant = (status) => status === "done" ? "success" : status === "in_progress" ? "warning" : "danger";

function Status({ item, getMembershipStatusLabel }) {
  return <div className="min-w-0 space-y-1"><AdminStatusChip compact variant={statusVariant(item.status)}>{getMembershipStatusLabel(item.status)}</AdminStatusChip>{item.forwarded_at ? <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-emerald-300">Weitergeleitet</p> : null}</div>;
}

export default function MembershipRequestList({ membershipRequests, selectedMembershipRequestId, onSelectRequest, formatRequestDate, getMembershipStatusLabel, compact = false }) {
  if (!membershipRequests.length) return <AdminModuleEmptyState title="Keine Mitgliedsanfragen" description="Es liegen derzeit keine Mitgliedsanfragen vor." />;
  const cards = <AdminModuleCards className={compact ? "" : "xl:hidden"}>{membershipRequests.map((item) => <AdminListMobileCard key={item.id} onClick={() => onSelectRequest(item)} label={`Anfrage von ${fullName(item)} öffnen`} className={selectedMembershipRequestId === item.id ? "border-red-500/55 border-l-4 bg-red-600/[0.07]" : ""}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-base font-black text-white">{fullName(item)}</p><p className="mt-1 text-sm text-white/55">{formatRequestDate(item.created_at)}</p></div><AdminListChevron label="Übersicht" /></div><div className="mt-3"><Status item={item} getMembershipStatusLabel={getMembershipStatusLabel} /></div><p className="mt-3 break-words text-sm text-white/60">{item.teams?.name_de || "Keine Mannschaft"}{item.year_group ? ` · ${item.year_group}` : ""}</p></AdminListMobileCard>)}</AdminModuleCards>;
  if (compact) return cards;
  return <AdminModuleList mobile={cards} desktopClassName="hidden overflow-hidden xl:block"><AdminListHeader columns={columns} template={template} />{membershipRequests.map((item) => <AdminListRow key={item.id} onClick={() => onSelectRequest(item)} label={`Anfrage von ${fullName(item)} öffnen`} template={template} className={selectedMembershipRequestId === item.id ? "border-l-2 border-red-500 bg-red-600/[0.07]" : ""}><span className="min-w-0 break-words font-black text-white">{fullName(item)}</span><span className="min-w-0 break-words text-white/65">{item.teams?.name_de || "–"}{item.year_group ? ` · ${item.year_group}` : ""}</span><span className="text-white/60">{formatRequestDate(item.created_at)}</span><Status item={item} getMembershipStatusLabel={getMembershipStatusLabel} /><AdminListChevron label="Übersicht" /></AdminListRow>)}</AdminModuleList>;
}
