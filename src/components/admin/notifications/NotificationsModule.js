"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { deleteNotificationAction, deleteSelectedNotificationsAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/admin/notifications/actions";
import { AdminButton, AdminListHeader, AdminModuleCards, AdminModuleEmptyState, AdminModuleFilters, AdminModuleHeader, AdminModuleList, AdminModulePage, AdminModuleSearch, AdminStatusChip } from "@/components/admin/design-system";
import { filterNotifications, getNotificationTypes, getVisibleNotificationIds, toggleVisibleNotificationSelection } from "./notifications.core.mjs";
import { getNotificationTypeLabel } from "./preferences/notificationPreferencePolicy.mjs";
import NotificationItem from "./NotificationItem";
import NotificationDetailCard from "./NotificationDetailCard";

const TEMPLATE = "3rem minmax(0,1.2fr) minmax(0,2fr) 10rem 8rem 3rem";

export default function NotificationsModule({ initialItems = [], selectedId = null }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
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
    if (result.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
      router.refresh();
    }
  }

  function resetSelectionForFilter(setter, value) {
    setter(value);
    setSelectedIds([]);
    setBulkMessage("");
  }

  function toggleSelection(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setBulkMessage("");
  }

  function toggleAllVisible() {
    setSelectedIds((current) => toggleVisibleNotificationSelection(current, filtered));
    setBulkMessage("");
  }

  async function removeSelected() {
    const visibleIds = new Set(getVisibleNotificationIds(filtered));
    const ids = selectedIds.filter((id) => visibleIds.has(id));
    if (!ids.length || !window.confirm(`Möchtest du die ${ids.length} ausgewählten Benachrichtigungen wirklich löschen?`)) return;
    setBulkPending(true);
    setBulkMessage("");
    const result = await deleteSelectedNotificationsAction(ids);
    setBulkPending(false);
    if (!result.ok) return setBulkMessage("Die ausgewählten Benachrichtigungen konnten nicht gelöscht werden.");
    setItems((current) => current.filter((item) => !ids.includes(item.id)));
    setSelectedIds([]);
    setBulkMessage(`${result.deletedCount} Benachrichtigungen gelöscht.`);
    router.refresh();
  }

  const filters = (
    <AdminModuleFilters title="Benachrichtigungen filtern" panelId="notification-filter-panel">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-white/65">Status<select value={status} onChange={(event) => resetSelectionForFilter(setStatus, event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle</option><option value="unread">Ungelesen</option><option value="read">Gelesen</option></select></label>
        <label className="grid gap-2 text-sm font-bold text-white/65">Typ<select value={type} onChange={(event) => resetSelectionForFilter(setType, event.target.value)} className="h-11 rounded-xl border border-white/10 bg-[#17171d] px-3 text-white"><option value="all">Alle Typen</option>{types.map((value) => <option key={value} value={value}>{getNotificationTypeLabel(value)}</option>)}</select></label>
      </div>
    </AdminModuleFilters>
  );

  return (
    <AdminModulePage>
      <AdminModuleHeader eyebrow="Persönlich" title="Benachrichtigungen" description="Deine persönlichen Hinweise und Systeminformationen im Überblick."><AdminModuleSearch value={search} onChange={(event) => resetSelectionForFilter(setSearch, event.target.value)} placeholder="Benachrichtigungen suchen …" label="Benachrichtigungen durchsuchen" /></AdminModuleHeader>
      <div className="flex justify-end"><AdminButton href="/admin/notifications/settings">Benachrichtigungseinstellungen</AdminButton></div>
      {filters}
      {filtered.length ? <BulkSelectionBar filtered={filtered} selectedIds={selectedIds} pending={bulkPending} message={bulkMessage} onToggleAll={toggleAllVisible} onMarkAll={markAll} onRemoveSelected={removeSelected} /> : null}
      {selected ? <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]"><div className="order-2 min-w-0 xl:order-1">{filtered.length ? <NotificationList filtered={filtered} selectedId={selectedId} selectedIds={selectedIds} onToggleSelection={toggleSelection} onOpen={openItem} onRemove={remove} /> : <AdminModuleEmptyState icon={Bell} title="Keine weiteren Benachrichtigungen" description="Die ausgewählte Meldung bleibt rechts beziehungsweise oberhalb sichtbar." />}</div><div className="order-1 min-w-0 xl:order-2"><NotificationDetailCard item={selected} /></div></div> : filtered.length === 0 ? <AdminModuleEmptyState icon={Bell} title="Keine Benachrichtigungen vorhanden" description="Neue persönliche Hinweise erscheinen automatisch in diesem Bereich." /> : <NotificationList filtered={filtered} selectedId={selectedId} selectedIds={selectedIds} onToggleSelection={toggleSelection} onOpen={openItem} onRemove={remove} />}
    </AdminModulePage>
  );
}

function BulkSelectionBar({ filtered, selectedIds, pending, message, onToggleAll, onMarkAll, onRemoveSelected }) {
  const selectedCount = selectedIds.length;
  const allVisibleSelected = filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));
  return <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-3"><label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-black"><input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll} className="h-5 w-5 accent-red-500" />{allVisibleSelected ? "Alle abwählen" : "Alle auswählen"}</label><span className="text-sm text-white/55" aria-live="polite">{selectedCount} ausgewählt</span>{message ? <span className="text-sm text-white/55">{message}</span> : null}</div><div className="flex flex-col gap-2 sm:flex-row"><AdminButton onClick={onMarkAll}>Alle als gelesen markieren</AdminButton><AdminButton variant="danger" disabled={!selectedCount || pending} onClick={onRemoveSelected} className="disabled:cursor-not-allowed disabled:opacity-45">{pending ? "Wird gelöscht …" : "Ausgewählte löschen"}</AdminButton></div></div>;
}

function NotificationList({ filtered, selectedId, selectedIds, onToggleSelection, onOpen, onRemove }) {
  return (
        <AdminModuleList desktopClassName="hidden overflow-hidden xl:block" mobile={<AdminModuleCards className="xl:hidden">{filtered.map((item) => <div key={item.id} className={`relative rounded-2xl ${item.id === selectedId ? "ring-2 ring-red-500/45" : ""}`}><label className="absolute left-2 top-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#17171d]/90"><span className="sr-only">{item.title} auswählen</span><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggleSelection(item.id)} className="h-5 w-5 accent-red-500" /></label><div className="pl-10"><NotificationItem item={item} onOpen={onOpen} /></div><button type="button" onClick={() => onRemove(item.id)} aria-label={`${item.title} löschen`} className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-white/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button></div>)}</AdminModuleCards>}>
          <AdminListHeader template={TEMPLATE} columns={[{ key: "select", label: "Auswahl" }, { key: "title", label: "Titel" }, { key: "message", label: "Kurztext" }, { key: "type", label: "Typ" }, { key: "status", label: "Status" }, { key: "action", label: "" }]} />
          {filtered.map((item) => <div key={item.id} style={{ gridTemplateColumns: TEMPLATE }} className={`grid items-center gap-4 border-t border-white/10 px-5 py-3 text-sm ${item.id === selectedId ? "bg-red-500/10 ring-1 ring-inset ring-red-500/35" : ""}`}><label className="flex h-11 w-11 cursor-pointer items-center justify-center"><span className="sr-only">{item.title} auswählen</span><input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => onToggleSelection(item.id)} className="h-5 w-5 accent-red-500" /></label><button type="button" onClick={() => onOpen(item)} className="truncate text-left font-black hover:text-red-300">{item.title}</button><button type="button" onClick={() => onOpen(item)} className="truncate text-left text-white/55">{item.message || "–"}</button><span className="min-w-0"><span className="block truncate text-xs font-bold text-white/65">{getNotificationTypeLabel(item.type)}</span><code className="mt-0.5 block truncate text-[0.65rem] text-white/30">{item.type}</code></span><AdminStatusChip compact variant={item.isRead ? "neutral" : "warning"}>{item.isRead ? "Gelesen" : "Ungelesen"}</AdminStatusChip><button type="button" onClick={() => onRemove(item.id)} aria-label={`${item.title} löschen`} className="flex h-11 w-11 items-center justify-center rounded-full text-white/35 hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16} /></button></div>)}
        </AdminModuleList>
  );
}
