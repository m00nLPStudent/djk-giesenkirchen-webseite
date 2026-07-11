"use client";

import { useEffect, useState } from "react";
import DashboardStatCard from "./DashboardStatCard";
import { DASHBOARD_STAT_ITEMS } from "./dashboard.options";
import { canSeeDashboardAction } from "@/lib/admin-auth/permissionEngine";
import { getAdminFallbackUserContext } from "@/lib/admin-auth/permissionFallbacks";
import { getCurrentAdminContext } from "@/lib/admin-auth/adminSession.service";

export default function DashboardStatGrid({ stats }) {
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

  const visibleItems = DASHBOARD_STAT_ITEMS.filter(
    (item) =>
      !item.requiredPermission || canSeeDashboardAction(userContext, item),
  );

  return (
    <section className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {visibleItems.map((item) => (
          <DashboardStatCard
            key={item.key}
            label={item.label}
            value={stats?.[item.key] || 0}
            href={item.href}
          />
        ))}
      </div>
    </section>
  );
}
