import { AdminMetric, AdminModuleSummary } from "@/components/admin/design-system";

export default function PermissionsStatsGrid({ stats }) {
  return <AdminModuleSummary><AdminMetric label="Permissions" value={stats?.totalPermissions || 0} /><AdminMetric label="Kategorien" value={stats?.totalCategories || 0} /><AdminMetric label="Zugeordnet" value={stats?.assignedRolePermissions || 0} /><AdminMetric label="Nicht zugeordnet" value={stats?.unassignedPermissions || 0} /></AdminModuleSummary>;
}
