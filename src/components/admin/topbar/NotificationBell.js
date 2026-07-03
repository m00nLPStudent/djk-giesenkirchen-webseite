"use client";

import { Bell } from "lucide-react";

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Benachrichtigungen"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-red-500/70 hover:bg-white/[0.07] hover:text-white"
    >
      <Bell size={18} />
      <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
    </button>
  );
}
