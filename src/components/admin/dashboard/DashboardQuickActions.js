"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getVisibleDashboardQuickActions } from "./dashboard.options";
import AdminPanel from "@/components/admin/common/AdminPanel";
import { getAdminFallbackUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";

export default function DashboardQuickActions() {
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

  const visibleActions = getVisibleDashboardQuickActions(userContext);

  return (
    <AdminPanel>
      <h2 className="text-xl font-black md:text-2xl">Schnellzugriffe</h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visibleActions.map((action) => (
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
