import { AdminListChevron, AdminListMobileCard, AdminStatusChip } from "@/components/admin/design-system";
import { formatEventDate, formatEventTime } from "@/lib/events";

const STATUS_LABELS = { entwurf: "Entwurf", geplant: "Geplant", veroeffentlicht: "Veröffentlicht", vergangen: "Vergangen" };

export function EventStatus({ event }) {
  const variants = { entwurf: "default", geplant: "warning", veroeffentlicht: "success", vergangen: "neutral" };
  return <AdminStatusChip compact variant={variants[event.admin_status]}>{STATUS_LABELS[event.admin_status] || event.admin_status}</AdminStatusChip>;
}

export function EventSource({ event }) {
  return <AdminStatusChip compact variant={event.admin_source === "mannschaft" ? "blue" : "default"}>{event.admin_source === "mannschaft" ? "Mannschaftstermin" : "Vereinstermin"}</AdminStatusChip>;
}

export function formatEventDateTime(event) {
  return `${formatEventDate(event.starts_at)} · ${formatEventTime(event.starts_at, { isAllDay: event.is_all_day })}`;
}

export default function EventCard({ item, href }) {
  const teamMeta = [item.team_name_de, item.team_season_name].filter(Boolean).join(" · ");
  return <AdminListMobileCard href={href} label={href ? `${item.title_de} öffnen` : undefined}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap gap-2"><EventSource event={item} /><EventStatus event={item} /></div><h2 className="mt-3 break-words text-lg font-black text-white">{item.title_de}</h2><p className="mt-2 text-sm text-white/60">{formatEventDateTime(item)}</p>{teamMeta ? <p className="mt-1 break-words text-sm text-white/45">{teamMeta}</p> : null}</div>{href ? <AdminListChevron label={`${item.title_de} öffnen`} /> : null}</div></AdminListMobileCard>;
}
