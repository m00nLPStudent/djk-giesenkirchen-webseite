"use client";

import { ChevronRight } from "lucide-react";
import { formatNotificationAge } from "./notifications.core.mjs";

export default function NotificationItem({ item, onOpen, compact = false }) {
  return (
    <button type="button" onClick={() => onOpen(item)} className={`flex w-full items-start gap-3 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400 ${compact ? "px-4 py-3" : "rounded-2xl border border-white/10 bg-white/[0.035] p-4"}`}>
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? "bg-white/15" : "bg-red-500"}`} aria-label={item.isRead ? "Gelesen" : "Ungelesen"} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-white">{item.title}</span>
        <span className={`mt-1 block text-sm leading-5 text-white/55 ${compact ? "line-clamp-2" : ""}`}>{item.message || "Keine weitere Beschreibung."}</span>
        <span className="mt-2 block text-xs text-white/35">{formatNotificationAge(item.createdAt)}</span>
      </span>
      <ChevronRight size={17} className="mt-1 shrink-0 text-white/35" aria-hidden="true" />
    </button>
  );
}
