import RolesStatCard from "./RolesStatCard";

export default function RolesStatsGrid({ stats }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <RolesStatCard label="Rollen gesamt" value={stats?.totalRoles || 0} />
      <RolesStatCard label="Aktive Rollen" value={stats?.activeRoles || 0} />
      <RolesStatCard
        label="Inaktive Rollen"
        value={stats?.inactiveRoles || 0}
      />
      <RolesStatCard
        label="Zugewiesene Benutzerrollen"
        value={stats?.assignedUserRoles || 0}
      />
      <RolesStatCard
        label="Permissions gesamt"
        value={stats?.totalPermissions || 0}
      />
    </section>
  );
}
