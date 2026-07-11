"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { canSeeAdminNavItem } from "@/lib/admin-auth/permissionEngine";
import { getAdminFallbackUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";
import {
  LayoutDashboard,
  Newspaper,
  Key,
  Lock,
  Shield,
  Users,
  UserRound,
  Image,
  CalendarDays,
  Trophy,
  Settings,
  Building2,
  Handshake,
  BookOpen,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    requiredPermission: "dashboard.view",
  },
  {
    href: "/admin/news",
    label: "News",
    icon: Newspaper,
    requiredPermission: "news.view",
  },
  {
    href: "/admin/department",
    label: "Abteilung",
    icon: Building2,
    requiredPermission: "system.view",
  },
  {
    href: "/admin/sponsors",
    label: "Sponsoren",
    icon: Handshake,
    requiredPermission: "sponsors.view",
  },
  {
    href: "/admin/teams",
    label: "Mannschaften",
    icon: Shield,
    requiredPermission: "teams.view",
  },
  {
    href: "/admin/coaches",
    label: "Trainer",
    icon: UserRound,
    requiredPermission: "coaches.view",
  },
  {
    href: "/admin/players",
    label: "Spieler",
    icon: Users,
    requiredPermission: "players.view",
  },
  {
    href: "/admin/media",
    label: "Medien",
    icon: Image,
    requiredPermission: "system.view",
  },
  {
    href: "/admin/events",
    label: "Termine",
    icon: CalendarDays,
    requiredPermission: "events.view",
  },
  {
    href: "/admin/club-history",
    label: "Vereinsgeschichte",
    icon: BookOpen,
    requiredPermission: "club_history.view",
  },
  {
    href: "/admin/tournaments",
    label: "Turniere",
    icon: Trophy,
    requiredPermission: "system.view",
  },
  {
    href: "/admin/users",
    label: "Benutzer",
    icon: Users,
    requiredPermission: "users.view",
  },
  {
    href: "/admin/roles",
    label: "Rollen",
    icon: Key,
    requiredPermission: "roles.view",
  },
  {
    href: "/admin/permissions",
    label: "Rechte",
    icon: Lock,
    requiredPermission: "permissions.view",
  },
  {
    href: "/admin/settings",
    label: "Einstellungen",
    icon: Settings,
    requiredPermission: "settings.view",
  },
];

export default function AdminSidebar({ mobile = false, onNavigate }) {
  const pathname = usePathname();
  const [userContext, setUserContext] = useState(getAdminFallbackUserContext());

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        const context = await getCurrentAdminContext();
        if (!active) return;
        setUserContext(context || getAdminFallbackUserContext());
      } catch {
        if (!active) return;
        setUserContext(getAdminFallbackUserContext());
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, []);

  const visibleNavItems = navItems.filter((item) =>
    canSeeAdminNavItem(userContext, item),
  );

  const navSections = [
    {
      label: "Inhalte",
      hrefs: ["/admin", "/admin/news", "/admin/events", "/admin/media"],
    },
    {
      label: "Vereinsstruktur",
      hrefs: [
        "/admin/department",
        "/admin/sponsors",
        "/admin/teams",
        "/admin/coaches",
        "/admin/players",
        "/admin/club-history",
        "/admin/tournaments",
      ],
    },
    {
      label: "System",
      hrefs: [
        "/admin/users",
        "/admin/roles",
        "/admin/permissions",
        "/admin/settings",
      ],
    },
  ];

  return (
    <aside
      className={`flex flex-col bg-black/35 backdrop-blur-xl ${
        mobile
          ? "rounded-[2rem] border border-white/10 px-3 py-3"
          : "h-full border-r border-white/10 px-4 py-4 lg:overflow-hidden"
      }`}
    >
      <nav
        className={`grid gap-4 ${mobile ? "max-h-[calc(100vh-14rem)] overflow-y-auto pr-1 admin-sidebar-scrollbar" : "lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 admin-sidebar-scrollbar"}`}
      >
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-2 text-[0.6rem] font-black uppercase tracking-[0.4em] text-white/35">
              {section.label}
            </p>

            <div className="space-y-2">
              {visibleNavItems
                .filter((item) =>
                  section.hrefs.some((href) => item.href === href),
                )
                .map((item) => {
                  const Icon = item.icon;
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 font-bold transition ${
                        active
                          ? "border-red-500/40 bg-red-600/15 text-white shadow-lg shadow-red-950/20"
                          : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <Icon
                        size={19}
                        className={active ? "text-red-300" : "text-white/55"}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={`mt-4 px-2 text-[0.65rem] leading-5 text-white/35 ${mobile ? "shrink-0" : "lg:mt-5 lg:shrink-0"}`}
      >
        DJK/VfL Giesenkirchen 05/09 e.V. · Vereins-CMS v0.1
      </div>
    </aside>
  );
}
