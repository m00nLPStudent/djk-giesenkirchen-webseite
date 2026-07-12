"use client";

import DashboardStatCard from "./DashboardStatCard";
import { DASHBOARD_STAT_ITEMS } from "./dashboard.options";
import { useAdminUiContext } from "@/components/admin/auth/AdminUiContext";
import { filterVisibleAdminUiItems } from "@/lib/admin-auth/adminUiVisibility";

export default function DashboardStatGrid({ stats }) {
  const { isReady, userContext } = useAdminUiContext();

  const visibleItems = isReady
    ? filterVisibleAdminUiItems(userContext, DASHBOARD_STAT_ITEMS)
    : DASHBOARD_STAT_ITEMS.filter((item) => !item.requiredPermission);

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
