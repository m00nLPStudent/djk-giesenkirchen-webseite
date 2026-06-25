import Link from "next/link";
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
  ExternalLink,
} from "lucide-react";

const logoUrl =
  "https://dbiwxylqbkxpkwkfcjut.supabase.co/storage/v1/object/public/media/logos/Giesenkirchen.png";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/teams", label: "Mannschaften", icon: Shield },
  { href: "/admin/coaches", label: "Trainer", icon: UserRound },
  { href: "/admin/players", label: "Spieler", icon: Users },
  { href: "/admin/media", label: "Medien", icon: Image },
  { href: "/admin/events", label: "Termine", icon: CalendarDays },
  { href: "/admin/tournaments", label: "Turniere", icon: Trophy },
  { href: "/admin/settings", label: "Einstellungen", icon: Settings },
];

export default function AdminLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#101014] text-white">
      <div className="grid min-h-screen lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col border-r border-white/10 bg-black/40 px-6 pt-28 pb-6">
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

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/10 pt-6">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 font-bold text-white/70 transition hover:border-red-500 hover:text-white"
            >
              <ExternalLink size={20} />
              Webseite ansehen
            </Link>

            <p className="mt-5 text-xs leading-6 text-white/35">
              DJK/VfL Giesenkirchen 05/09 e.V.
              <br />
              Adminbereich
            </p>
          </div>
        </aside>

        <section className="px-6 pt-32 pb-20">
          <div className="mx-auto max-w-7xl">
            {(title || subtitle) && (
              <div className="mb-10">
                {subtitle && (
                  <p className="text-sm font-bold uppercase tracking-[0.35em] text-red-400">
                    {subtitle}
                  </p>
                )}

                {title && <h1 className="mt-4 text-5xl font-black">{title}</h1>}
              </div>
            )}

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
