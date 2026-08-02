import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function UsersStatsGrid({ stats }) {
  return <AdminModuleSummary><AdminMetric label="Gesamt" value={stats?.totalUsers || 0} /><AdminMetric label="Aktiv" value={stats?.activeUsers || 0} /><AdminMetric label="Inaktiv" value={stats?.inactiveUsers || 0} /><AdminMetric label="Rollen" value={stats?.totalRoles || 0} /></AdminModuleSummary>;
}
