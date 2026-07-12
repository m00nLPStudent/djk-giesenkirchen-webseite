"use client";

import Link from "next/link";
import { useState } from "react";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import { filterVisibleAdminUiItems } from "@/lib/admin-auth/adminUiVisibility";
import {
  Plus,
  Newspaper,
  Shield,
  UserRound,
  Users,
  Building2,
  Handshake,
} from "lucide-react";

export default function AdminCreateMenu() {
  const [open, setOpen] = useState(false);
  const { isReady, userContext } = useAdminUiContext();

  const items = [
    {
      href: "/admin/news/new",
      label: "Neue News",
      icon: Newspaper,
      requiredPermission: "news.create",
    },
    {
      href: "/admin/sponsors/new",
      label: "Neuer Sponsor",
      icon: Handshake,
      requiredPermission: "sponsors.create",
    },
    {
      href: "/admin/department/board/new",
      label: "Neues Vorstandsmitglied",
      icon: Building2,
      requiredPermission: "settings.edit",
    },
    {
      href: "/admin/teams/new",
      label: "Neue Mannschaft",
      icon: Shield,
      requiredPermission: "teams.create",
    },
    {
      href: "/admin/coaches/new",
      label: "Neuer Trainer",
      icon: UserRound,
      requiredPermission: "coaches.create",
    },
    {
      href: "/admin/players/new",
      label: "Neuer Spieler",
      icon: Users,
      requiredPermission: "players.create",
    },
  ];

  const visibleItems = isReady
    ? filterVisibleAdminUiItems(userContext, items)
    : [];

  if (!visibleItems.length) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 text-sm font-bold transition hover:bg-red-700"
      >
        <Plus size={18} />
        Neu
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#18181d] shadow-2xl">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-5 py-4 font-bold text-white/80 hover:bg-white/5 hover:text-white"
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
