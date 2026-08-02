import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function RolesStatsGrid({ stats }) {
  return <AdminModuleSummary><AdminMetric label="Rollen" value={stats?.totalRoles || 0} /><AdminMetric label="Aktiv" value={stats?.activeRoles || 0} /><AdminMetric label="Inaktiv" value={stats?.inactiveRoles || 0} /><AdminMetric label="Permissions" value={stats?.totalPermissions || 0} /></AdminModuleSummary>;
}
