import DashboardStatCard from "./DashboardStatCard";
import { DASHBOARD_STAT_ITEMS } from "./dashboard.options";

export default function DashboardStatGrid({ stats }) {
  return (
    <section className="mt-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_STAT_ITEMS.map((item) => (
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
