"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Shield,
  Users,
  UserRound,
  Image,
  CalendarDays,
  Trophy,
  Settings,
  Building2,
} from "lucide-react";

const logoUrl =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/department", label: "Abteilung", icon: Building2 },
  { href: "/admin/teams", label: "Mannschaften", icon: Shield },
  { href: "/admin/coaches", label: "Trainer", icon: UserRound },
  { href: "/admin/players", label: "Spieler", icon: Users },
  { href: "/admin/media", label: "Medien", icon: Image },
  { href: "/admin/events", label: "Termine", icon: CalendarDays },
  { href: "/admin/tournaments", label: "Turniere", icon: Trophy },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col border-r border-white/10 bg-black/40 px-6 pt-8 pb-6">
      <div className="mb-10 flex items-center gap-4">
        <img
          src={logoUrl}
          alt="DJK/VfL Giesenkirchen"
          className="h-14 w-14 object-contain"
        />

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-red-400">
            Vereins-CMS
          </p>
          <h2 className="mt-1 text-xl font-black leading-tight">
            DJK/VfL
            <br />
            Giesenkirchen
          </h2>
        </div>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition ${
                active
                  ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-6">
        <p className="text-xs leading-6 text-white/35">
          DJK/VfL Giesenkirchen 05/09 e.V.
          <br />
          Vereins-CMS v0.1
        </p>
      </div>
    </aside>
  );
}
