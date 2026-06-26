import Link from "next/link";
import { Plus, Newspaper, Shield, UserRound, Users, Image } from "lucide-react";

const actions = [
  {
    label: "Neue News",
    href: "/admin/news/new",
    icon: Newspaper,
    primary: true,
  },
  {
    label: "Neue Mannschaft",
    href: "/admin/teams/new",
    icon: Shield,
  },
  {
    label: "Neuer Trainer",
    href: "/admin/coaches/new",
    icon: UserRound,
  },
  {
    label: "Neuer Spieler",
    href: "/admin/players/new",
    icon: Users,
  },
  {
    label: "Medien hochladen",
    href: "/admin/media",
    icon: Image,
  },
];

export default function DashboardQuickActions() {
  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-black">Schnellzugriffe</h2>

      <div className="mt-6 flex flex-wrap gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-2 rounded-full px-5 py-3 font-bold transition ${
                action.primary
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-white/10 text-white/70 hover:border-red-500 hover:text-white"
              }`}
            >
              <Plus size={18} />
              <Icon size={18} />
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
