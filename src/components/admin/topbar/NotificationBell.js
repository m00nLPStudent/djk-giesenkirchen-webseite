"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { loadNotificationCenterAction, markAllNotificationsReadAction, markNotificationReadAction } from "@/app/admin/notifications/actions";
import NotificationItem from "@/components/admin/notifications/NotificationItem";

let sharedLoadPromise = null;
const loadShared = () => sharedLoadPromise || (sharedLoadPromise = loadNotificationCenterAction().finally(() => { sharedLoadPromise = null; }));

export default function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ items: [], unreadCount: 0, loading: true });

  async function refresh() {
    const result = await loadShared();
    setState({ items: result.items || [], unreadCount: result.unreadCount || 0, loading: false });
  }

  useEffect(() => {
    let active = true;
    const loadIntoState = () => void loadShared().then((result) => {
      if (active) setState({ items: result.items || [], unreadCount: result.unreadCount || 0, loading: false });
    });
    loadIntoState();
    const onFocus = () => loadIntoState();
    const onOutside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("mousedown", onOutside);
    return () => { active = false; window.removeEventListener("focus", onFocus); document.removeEventListener("mousedown", onOutside); };
  }, []);

  async function openItem(item) {
    if (!item.isRead) await markNotificationReadAction(item.id);
    setOpen(false);
    await refresh();
    router.push(item.targetUrl);
  }

  async function markAll() {
    await markAllNotificationsReadAction();
    await refresh();
  }

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-label={`Benachrichtigungen${state.unreadCount ? `, ${state.unreadCount} ungelesen` : ""}`} aria-expanded={open} aria-controls="admin-notification-popover" onClick={() => { setOpen((value) => !value); if (!open) void refresh(); }} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-red-500/70 hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
        <Bell size={18} aria-hidden="true" />
        {state.unreadCount ? <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] font-black text-white">{state.unreadCount > 99 ? "99+" : state.unreadCount}</span> : null}
      </button>
      {open ? (
        <section id="admin-notification-popover" aria-label="Neueste Benachrichtigungen" className="fixed inset-x-4 top-20 z-50 overflow-hidden rounded-3xl border border-white/10 bg-[#18181d] shadow-2xl shadow-black/50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[25rem]">
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><h2 className="font-black">Benachrichtigungen</h2>{state.unreadCount ? <button type="button" onClick={markAll} className="min-h-11 text-xs font-bold text-red-300 hover:text-red-200">Alle gelesen</button> : null}</header>
          <div className="max-h-[min(65vh,32rem)] overflow-y-auto divide-y divide-white/10">
            {state.loading ? <p className="p-6 text-sm text-white/50">Wird geladen …</p> : state.items.length ? state.items.map((item) => <NotificationItem key={item.id} item={item} onOpen={openItem} compact />) : <p className="p-6 text-center text-sm text-white/50">Keine Benachrichtigungen vorhanden.</p>}
          </div>
          <button type="button" onClick={() => { setOpen(false); router.push("/admin/notifications"); }} className="flex min-h-12 w-full items-center justify-center border-t border-white/10 text-sm font-black text-red-300 hover:bg-white/[0.04]">Alle Benachrichtigungen anzeigen</button>
        </section>
      ) : null}
    </div>
  );
}
