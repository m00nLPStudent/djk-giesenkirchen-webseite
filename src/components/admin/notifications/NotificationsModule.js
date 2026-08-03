"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { deleteAllReadNotificationsAction, deleteNotificationAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/admin/notifications/actions";
import { AdminButton, AdminListHeader, AdminModuleCards, AdminModuleEmptyState, AdminModuleFilters, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModuleSearch, AdminStatusChip } from "@/components/admin/design-system";
import { filterNotifications, getNotificationTypes } from "./notifications.core.mjs";
import NotificationItem from "./NotificationItem";
import NotificationDetailCard from "./NotificationDetailCard";

const TEMPLATE = "minmax(0,1.2fr) minmax(0,2fr) 10rem 8rem 3rem";

export default function NotificationsModule({ initialItems = [], selectedId = null }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const filtered = useMemo(() => filterNotifications(items, { search, status, type }), [items, search, status, type]);
  const types = useMemo(() => getNotificationTypes(items), [items]);
  const selected = items.find((item) => item.id === selectedId) || null;

  async function openItem(item) {
    if (!item.isRead) {
      const result = await markNotificationReadAction(item.id);
      if (result.ok) setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, isRead: true, readAt: new Date().toISOString() } : entry));
    }
    router.push(item.targetUrl);
  }

  async function markAll() {
    const result = await markAllNotificationsReadAction();
    if (result.ok) setItems((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
  }

  async function remove(id) {
    const result = await deleteNotificationAction(id);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  async function removeRead() {
    const result = await deleteAllReadNotificationsAction();
    if (result.ok) setItems((current) => current.filter((item) => !item.isRead));
  }

  const filters = (
    <AdminModuleFilters title="Benachrichtigungen filtern" panelId="notification-filter-panel">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white/65">Status<select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle</option><option value="unread">Ungelesen</option><option value="read">Gelesen</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-white/65">Typ<select value={type} onChange={(event) => setType(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle Typen</option>{types.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
    </AdminModuleFilters>
  );

  return (
    <AdminModulePage>
      <AdminModuleHeader eyebrow="Persönlich" title="Benachrichtigungen" description="Deine persönlichen Hinweise und Systeminformationen im Überblick." actions={<><AdminButton onClick={markAll}>Alle als gelesen markieren</AdminButton><AdminButton onClick={removeRead}>Gelesene löschen</AdminButton></>}><AdminModuleSearch value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Benachrichtigungen suchen …" label="Benachrichtigungen durchsuchen" /></AdminModuleHeader>
      {filters}
      {selected ? <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]"><div className="order-2 min-w-0 xl:order-1">{filtered.length ? <NotificationList filtered={filtered} selectedId={selectedId} onOpen={openItem} onRemove={remove} /> : <AdminModuleEmptyState icon={Bell} title="Keine weiteren Benachrichtigungen" description="Die ausgewählte Meldung bleibt rechts beziehungsweise oberhalb sichtbar." />}</div><div className="order-1 min-w-0 xl:order-2"><NotificationDetailCard item={selected} /></div></div> : filtered.length === 0 ? <AdminModuleEmptyState icon={Bell} title="Keine Benachrichtigungen vorhanden" description="Neue persönliche Hinweise erscheinen automatisch in diesem Bereich." /> : <NotificationList filtered={filtered} selectedId={selectedId} onOpen={openItem} onRemove={remove} />}
    </AdminModulePage>
  );
}

function NotificationList({ filtered, selectedId, onOpen, onRemove }) {
  return (
        <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{filtered.map((item) => <div key={item.id} className={`relative rounded-2xl ${item.id === selectedId ? "ring-2 ring-red-500/45" : ""}`}><NotificationItem item={item} onOpen={onOpen} /><button type="button" onClick={() => onRemove(item.id)} aria-label={`${item.title} löschen`} className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-white/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button></div>)}</AdminModuleCards>}>
          <AdminListHeader template={TEMPLATE} columns={[{ key: "title", label: "Titel" }, { key: "message", label: "Kurztext" }, { key: "type", label: "Typ" }, { key: "status", label: "Status" }, { key: "action", label: "" }]} />
          {filtered.map((item) => <div key={item.id} style={{ gridTemplateColumns: TEMPLATE }} className={`grid items-center gap-4 border-t border-white/10 px-5 py-3 text-sm ${item.id === selectedId ? "bg-red-500/10 ring-1 ring-inset ring-red-500/35" : ""}`}><button type="button" onClick={() => onOpen(item)} className="truncate text-left font-black hover:text-red-300">{item.title}</button><button type="button" onClick={() => onOpen(item)} className="truncate text-left text-white/55">{item.message || "–"}</button><span className="truncate text-xs text-white/45">{item.type}</span><AdminStatusChip compact variant={item.isRead ? "neutral" : "warning"}>{item.isRead ? "Gelesen" : "Ungelesen"}</AdminStatusChip><button type="button" onClick={() => onRemove(item.id)} aria-label={`${item.title} löschen`} className="flex h-11 w-11 items-center justify-center rounded-full text-white/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button></div>)}
        </AdminModuleList>
  );
}
