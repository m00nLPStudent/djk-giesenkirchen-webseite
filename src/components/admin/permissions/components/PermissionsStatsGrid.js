import PermissionsStatCard from "./PermissionsStatCard";

export default function PermissionsStatsGrid({ stats }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PermissionsStatCard
        label="Permissions gesamt"
        value={stats?.totalPermissions || 0}
      />
      <PermissionsStatCard
        label="Kategorien gesamt"
        value={stats?.totalCategories || 0}
      />
      <PermissionsStatCard
        label="Zugeordnete Rollen-Permissions"
        value={stats?.assignedRolePermissions || 0}
      />
      <PermissionsStatCard
        label="Nicht zugeordnete Permissions"
        value={stats?.unassignedPermissions || 0}
      />
    </section>
  );
}
