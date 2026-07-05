import Link from "next/link";
import { Plus } from "lucide-react";
import { DASHBOARD_QUICK_ACTIONS } from "./dashboard.options";
import AdminPanel from "@/components/admin/common/AdminPanel";

export default function DashboardQuickActions() {
  return (
    <AdminPanel>
      <h2 className="text-xl font-black md:text-2xl">Schnellzugriffe</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DASHBOARD_QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              action.tone === "primary"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-white/10 bg-black/20 text-white/75 hover:border-red-500/50 hover:text-white"
            }`}
          >
            <Plus size={16} />
            {action.label}
          </Link>
        ))}
      </div>
    </AdminPanel>
  );
}
