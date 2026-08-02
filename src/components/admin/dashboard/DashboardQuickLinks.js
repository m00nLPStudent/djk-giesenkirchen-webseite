import Link from "next/link";
import { createElement } from "react";
import { ArrowUpRight } from "lucide-react";
import { getAdminNavigationIcon } from "@/components/admin/navigation/adminNavigation.icons";

export default function DashboardQuickLinks({ links = [] }) {
  if (!links.length) return null;
  return (
    <section aria-labelledby="dashboard-quicklinks" className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h2 id="dashboard-quicklinks" className="text-sm font-black text-white">Schnellnavigation</h2>
      <div className="mt-3 divide-y divide-white/10">
        {links.map((link) => <Link key={link.key} href={link.href} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm font-bold text-white/70 transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
          {createElement(getAdminNavigationIcon(link.icon), { size: 17, className: "text-red-300" })}<span className="min-w-0 flex-1">{link.label}</span><ArrowUpRight size={15} className="text-white/30" />
        </Link>)}
      </div>
    </section>
  );
}
